// src/modules/actuators/actuators.service.ts
import { prisma } from '../../config/database';
import { getMqttClient } from '../../mqtt/mqtt.client';
import { CommandPayload } from '../../types';
import { logger } from '../../config/logger';

const DEFAULT_MANUAL_TIMEOUT_SECS = 1800; // 30 min (RN02)

export class ActuatorsService {
  /**
   * Issue a manual command to an actuator (RN01, RN02)
   * Publishes MQTT cmd with QoS 1 and sets manual lock with timeout.
   */
  async command(
    greenhouseId: string,
    actuatorName: string,
    state: boolean,
    userId: string,
    userEmail: string,
    timeoutSecs: number = DEFAULT_MANUAL_TIMEOUT_SECS
  ) {
    const actuator = await prisma.actuator.findUnique({
      where: { greenhouseId_name: { greenhouseId, name: actuatorName } },
    });
    if (!actuator) throw new Error(`Actuator '${actuatorName}' not found`);

    const manualUntil = new Date(Date.now() + timeoutSecs * 1000);

    // Update state in DB
    await prisma.actuator.update({
      where: { id: actuator.id },
      data: { state, mode: 'manual', manualUntil },
    });

    // Audit log
    await prisma.actuatorLog.create({
      data: { actuatorId: actuator.id, userId, state, trigger: 'MANUAL' },
    });

    // Publish MQTT command to ESP32 (QoS 1, RN02)
    const payload: CommandPayload = {
      comando: state,
      tempo_ignorar_sensores: timeoutSecs,
      usuario: userEmail,
    };
    const mqtt = getMqttClient();
    mqtt.publish(`agrotech/${greenhouseId}/cmd/${actuatorName}`, JSON.stringify(payload), { qos: 1 });
    logger.info('Manual command sent', { greenhouseId, actuatorName, state, userEmail });

    return { actuatorId: actuator.id, state, mode: 'manual', manualUntil };
  }

  /**
   * Called by MQTT handler when ESP32 confirms actuator state (upstream)
   */
  async syncFromDevice(
    greenhouseId: string,
    actuatorName: string,
    state: boolean,
    trigger: 'AUTOMATIC' | 'MANUAL'
  ) {
    const actuator = await prisma.actuator.findUnique({
      where: { greenhouseId_name: { greenhouseId, name: actuatorName } },
    });
    if (!actuator) return;

    // If manual timeout has expired, revert to automatic (RN02)
    const mode = trigger === 'AUTOMATIC' ? 'automatic' : actuator.mode;
    const manualUntil = trigger === 'AUTOMATIC' ? null : actuator.manualUntil;

    await prisma.actuator.update({
      where: { id: actuator.id },
      data: { state, mode, manualUntil },
    });

    await prisma.actuatorLog.create({
      data: { actuatorId: actuator.id, state, trigger },
    });
  }

  async listByGreenhouse(greenhouseId: string) {
    return prisma.actuator.findMany({
      where: { greenhouseId },
      include: { logs: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
  }

  async getLogs(actuatorId: string, take = 50) {
    return prisma.actuatorLog.findMany({
      where: { actuatorId },
      orderBy: { createdAt: 'desc' },
      take,
      include: { user: { select: { name: true, email: true } } },
    });
  }
}
