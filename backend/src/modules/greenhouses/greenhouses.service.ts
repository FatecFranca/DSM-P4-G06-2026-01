// src/modules/greenhouses/greenhouses.service.ts
import { prisma } from '../../config/database';
import { getMqttClient } from '../../mqtt/mqtt.client';
import { ConfigPayload } from '../../types';
import { logger } from '../../config/logger';

export class GreenhousesService {
  async list() {
    return prisma.greenhouse.findMany({
      where: { active: true },
      include: { config: true, actuators: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const gh = await prisma.greenhouse.findUnique({
      where: { id },
      include: { config: true, actuators: true },
    });
    if (!gh) throw new Error('Greenhouse not found');
    return gh;
  }

  async create(name: string, description?: string) {
    return prisma.greenhouse.create({
      data: {
        name,
        description,
        config: { create: {} }, // defaults from schema
        actuators: {
          create: [
            { name: 'bomba' },
            { name: 'exaustor' },
            { name: 'lampada' },
          ],
        },
      },
      include: { config: true, actuators: true },
    });
  }

  async updateConfig(greenhouseId: string, payload: Partial<ConfigPayload>) {
    const config = await prisma.greenhouseConfig.update({
      where: { greenhouseId },
      data: {
        ...(payload.t_max !== undefined && { tempMax: payload.t_max }),
        ...(payload.t_min !== undefined && { tempMin: payload.t_min }),
        ...(payload.u_solo_min !== undefined && { humidSoilMin: payload.u_solo_min }),
        ...(payload.u_solo_max !== undefined && { humidSoilMax: payload.u_solo_max }),
        ...(payload.t_rega_max !== undefined && { irrigMaxSecs: payload.t_rega_max }),
        ...(payload.luz_on !== undefined && { lightOnTime: payload.luz_on }),
        ...(payload.luz_off !== undefined && { lightOffTime: payload.luz_off }),
      },
    });

    // Publish updated config to ESP32 with retain=true (RN03)
    const mqttPayload: ConfigPayload = {
      t_max: config.tempMax,
      t_min: config.tempMin,
      u_solo_min: config.humidSoilMin,
      u_solo_max: config.humidSoilMax,
      t_rega_max: config.irrigMaxSecs,
      luz_on: config.lightOnTime,
      luz_off: config.lightOffTime,
    };

    const mqtt = getMqttClient();
    const topic = `agrotech/${greenhouseId}/cmd/config`;
    mqtt.publish(topic, JSON.stringify(mqttPayload), { qos: 1, retain: true });
    logger.info('Config published to ESP32', { greenhouseId, topic });

    return config;
  }

  async deactivate(id: string) {
    return prisma.greenhouse.update({ where: { id }, data: { active: false } });
  }
}
