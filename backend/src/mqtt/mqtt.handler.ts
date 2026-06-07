// src/mqtt/mqtt.handler.ts
import { MqttClient } from 'mqtt';
import { Server as SocketServer } from 'socket.io';
import { SensorsService } from '../modules/sensors/sensors.service';
import { ActuatorsService } from '../modules/actuators/actuators.service';
import { AlertsService } from '../modules/alerts/alerts.service';
import { redis } from '../config/database';
import { logger } from '../config/logger';
import {
  SensorPayload,
  ActuatorStatusPayload,
  HeartbeatPayload,
  ServerToClientEvents,
  ClientToServerEvents,
} from '../types';
import {
  emitActuatorStatus,
  emitCriticalAlert,
  emitGreenhouseOffline,
  emitHeartbeat,
  emitSensorTelemetry,
} from '../realtime/realtime.service';
import { observeMqttMessage } from '../realtime/runtime-metrics.service';

const sensorsSvc = new SensorsService();
const actuatorsSvc = new ActuatorsService();
const alertsSvc = new AlertsService();

const HEARTBEAT_TTL = 15 * 60; // 15 min in seconds (RN11)
const HEARTBEAT_KEY = (id: string) => `heartbeat:${id}`;
const MQTT_TOPICS = ['agrotech/+/sensores/#', 'agrotech/+/status/#'];

function readNumber(payload: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function normalizeSensorPayload(payload: unknown): SensorPayload | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const data = payload as Record<string, unknown>;

  return {
    temp: readNumber(data, ['temp', 'temperatura', 'temperature']),
    umid_ar: readNumber(data, ['umid_ar', 'umidade_ar', 'humidity_air']),
    temp_solo: readNumber(data, ['temp_solo', 'temperatura_solo', 'soil_temp']),
    umid_solo: readNumber(data, ['umid_solo', 'umidade_solo', 'soil_moisture']),
    luz: readNumber(data, ['luz', 'luminosidade', 'light']),
  };
}

function normalizeActuatorPayload(payload: unknown): ActuatorStatusPayload | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const data = payload as Record<string, unknown>;
  const equip = data.equip ?? data.name ?? data.atuador;
  const rawState = data.estado ?? data.state;
  const trigger = data.gatilho === 'automatico' || data.gatilho === 'manual' ? data.gatilho : 'manual';

  if (typeof equip !== 'string') return null;

  return {
    equip,
    estado: typeof rawState === 'boolean' ? rawState : rawState === 'true' || rawState === 1,
    gatilho: trigger,
  };
}

function normalizeHeartbeatPayload(payload: unknown): HeartbeatPayload | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const data = payload as Record<string, unknown>;
  const status = data.status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE';

  return {
    status,
    uptime: readNumber(data, ['uptime']) ?? 0,
    wifi_rssi: readNumber(data, ['wifi_rssi', 'rssi']) ?? 0,
    mem_livre: readNumber(data, ['mem_livre', 'free_memory']) ?? 0,
  };
}

export function setupMqttHandlers(
  mqttClient: MqttClient,
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>
) {

  mqttClient.subscribe(MQTT_TOPICS, { qos: 1 }, (err, granted) => {
    if (err) logger.error('Subscribe erro', { err });
    else     logger.info('Subscribe aceito', { granted });
  });
  
  mqttClient.on('message', async (topic, rawPayload) => {
    // Ignora mensagens do próprio backend
    const rawText = rawPayload.toString();
    logger.info('MQTT payload recebido', { topic, payload: rawText });
    if (topic === 'agrotech/backend/status') return;

    logger.info('MQTT mensagem recebida', { topic });
    let payload: unknown;
    try {
      payload = JSON.parse(rawText);
      logger.info('MQTT payload JSON', { topic, payload });
    } catch {
      logger.warn('Invalid JSON from MQTT', { topic, payload: rawText });
      return;
    }

    const parts = topic.split('/');
    if (parts[0] !== 'agrotech') return;

    const hasGreenhouseInTopic = parts.length >= 4;
    const category = hasGreenhouseInTopic ? parts[2] : parts[1];
    const subcategory = hasGreenhouseInTopic ? parts[3] : parts[2];
    const greenhouseIdFromTopic = hasGreenhouseInTopic ? parts[1] : undefined;
    const greenhouseIdFromPayload =
      typeof payload === 'object' && payload !== null
        ? (payload as { greenhouseId?: string; greenhouse_id?: string }).greenhouseId ??
          (payload as { greenhouseId?: string; greenhouse_id?: string }).greenhouse_id
        : undefined;

    const greenhouseId = greenhouseIdFromTopic ?? greenhouseIdFromPayload;
    if (!greenhouseId) {
      logger.warn('Missing greenhouseId for MQTT message', { topic });
      return;
    }

    let handled = false;
    try {
      switch (`${category}/${subcategory}`) {
        case 'sensores/estado': {
          const data = normalizeSensorPayload(payload);
          if (!data) {
            logger.warn('Invalid sensor payload shape', { topic, payload });
            return;
          }
          await handleSensorData(greenhouseId, data, io);
          handled = true;
          break;
        }

        case 'status/atuadores': {
          const data = normalizeActuatorPayload(payload);
          if (!data) {
            logger.warn('Invalid actuator payload shape', { topic, payload });
            return;
          }
          await handleActuatorStatus(greenhouseId, data, io);
          handled = true;
          break;
        }

        case 'status/sistema':
        case 'status/conexao': {
          const data = normalizeHeartbeatPayload(payload);
          if (!data) {
            logger.warn('Invalid heartbeat payload shape', { topic, payload });
            return;
          }
          await handleHeartbeat(greenhouseId, data, io);
          handled = true;
          break;
        }

        default:
          logger.debug('Unhandled MQTT topic', { topic });
      }
    } catch (err) {
      observeMqttMessage(payload, false);
      logger.error('MQTT handler error', { topic, err });
      return;
    }

    observeMqttMessage(payload, handled);
  });
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleSensorData(
  greenhouseId: string,
  data: SensorPayload,
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>
) {
  // RN12: Validate reading — block automation and alert on invalid sensor
  
  const validationError = sensorsSvc.validateReading(data);
  if (validationError) {
    logger.error('Sensor hardware failure detected', { greenhouseId, validationError, data });

    const alreadyAlerted = await alertsSvc.hasPendingAlert(greenhouseId, 'SENSOR_FAILURE');
    if (!alreadyAlerted) {
      const alert = await alertsSvc.create(
        greenhouseId,
        'SENSOR_FAILURE',
        `Hardware failure: ${validationError}`,
        'CRITICAL',
        { raw: data }
      );
      emitCriticalAlert(io, {
        id: alert.id,
        greenhouseId,
        type: 'SENSOR_FAILURE',
        message: alert.message,
      });
    }
    return; // Do NOT persist or broadcast invalid readings
  }

  // Persist to InfluxDB (RN08)
  await sensorsSvc.writeTelemetry(greenhouseId, data);

  emitSensorTelemetry(io, greenhouseId, data);

  // RN10: Check critical thresholds
  await checkThresholds(greenhouseId, data, io);
}

async function handleActuatorStatus(
  greenhouseId: string,
  data: ActuatorStatusPayload,
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>
) {
  await actuatorsSvc.syncFromDevice(
    greenhouseId,
    data.equip,
    data.estado,
    data.gatilho === 'automatico' ? 'AUTOMATIC' : 'MANUAL'
  );

  emitActuatorStatus(io, greenhouseId, data);
}

async function handleHeartbeat(
  greenhouseId: string,
  data: HeartbeatPayload,
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>
) {
  // Store heartbeat timestamp in Redis with TTL (RN11)
  await redis.setex(HEARTBEAT_KEY(greenhouseId), HEARTBEAT_TTL, Date.now().toString());

  emitHeartbeat(io, greenhouseId, data);

  // If device was previously detected offline, auto-resolve that alert
  if (data.status === 'ONLINE') {
    const offlineAlerts = await alertsSvc.list(greenhouseId, 'OPEN');
    const offlineAlert = offlineAlerts.find((a) => a.type === 'DEVICE_OFFLINE');
    if (offlineAlert) {
      await alertsSvc.resolve(offlineAlert.id);
      logger.info('Device back online, alert resolved', { greenhouseId });
    }
  }
}

/**
 * RN10: Alert if conditions are outside safe range for >15 minutes.
 * Uses Redis to track first-seen timestamp of the anomaly.
 */
async function checkThresholds(
  greenhouseId: string,
  data: SensorPayload,
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>
) {
  // Could load config from DB; using fixed thresholds here as baseline.
  // In production: load from prisma.greenhouseConfig for per-greenhouse thresholds.
  const ALERT_DELAY_MS = 15 * 60 * 1000; // 15 min

  const checks: Array<{ condition: boolean; key: string; type: Parameters<typeof alertsSvc.create>[1]; msg: string }> = [
    {
      condition: data.temp != null && (data.temp > 35 || data.temp < 5),
      key: `anomaly:temp:${greenhouseId}`,
      type: 'TEMP_CRITICAL',
      msg: `Temperature out of safe range: ${data.temp}°C`,
    },
    {
      condition: data.umid_solo != null && data.umid_solo < 15,
      key: `anomaly:soil:${greenhouseId}`,
      type: 'HUMIDITY_CRITICAL',
      msg: `Soil humidity critically low: ${data.umid_solo}%`,
    },
  ];

  for (const check of checks) {
    if (check.condition) {
      const firstSeen = await redis.get(check.key);
      if (!firstSeen) {
        await redis.setex(check.key, 3600, Date.now().toString()); // track start
      } else {
        const elapsed = Date.now() - parseInt(firstSeen);
        if (elapsed >= ALERT_DELAY_MS) {
          const alreadyAlerted = await alertsSvc.hasPendingAlert(greenhouseId, check.type);
          if (!alreadyAlerted) {
            const alert = await alertsSvc.create(greenhouseId, check.type, check.msg, 'CRITICAL', {
              value: check.type === 'TEMP_CRITICAL' ? data.temp : data.umid_solo,
              elapsed_min: Math.floor(elapsed / 60000),
            });
            emitCriticalAlert(io, {
              id: alert.id,
              greenhouseId,
              type: check.type,
              message: alert.message,
            });
            await redis.del(check.key); // reset after alert
          }
        }
      }
    } else {
      await redis.del(check.key); // condition cleared, reset timer
    }
  }
}

/**
 * RN11: Heartbeat watchdog — called by a setInterval in server startup.
 * Marks greenhouse as OFFLINE if no heartbeat received in 15 min.
 */
export async function checkHeartbeats(
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>
) {
  // Get all known greenhouses and check their last heartbeat
  const { prisma } = await import('../config/database');
  const greenhouses = await prisma.greenhouse.findMany({ where: { active: true }, select: { id: true } });

  for (const { id } of greenhouses) {
    const lastSeen = await redis.get(HEARTBEAT_KEY(id));
    if (!lastSeen) {
      // Never seen or TTL expired → offline
      const alreadyAlerted = await alertsSvc.hasPendingAlert(id, 'DEVICE_OFFLINE');
      if (!alreadyAlerted) {
        const alert = await alertsSvc.create(
          id,
          'DEVICE_OFFLINE',
          'ESP32 has not sent a heartbeat in over 15 minutes.',
          'CRITICAL'
        );
        emitGreenhouseOffline(io, id);
        emitCriticalAlert(io, {
          id: alert.id,
          greenhouseId: id,
          type: 'DEVICE_OFFLINE',
          message: alert.message,
        });
        logger.warn('Greenhouse offline alert triggered', { greenhouseId: id });
      }
    }
  }
}
