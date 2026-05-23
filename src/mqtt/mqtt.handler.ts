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

const sensorsSvc = new SensorsService();
const actuatorsSvc = new ActuatorsService();
const alertsSvc = new AlertsService();

const HEARTBEAT_TTL = 15 * 60; // 15 min in seconds (RN11)
const HEARTBEAT_KEY = (id: string) => `heartbeat:${id}`;

export function setupMqttHandlers(
  mqttClient: MqttClient,
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>
) {
  // Subscribe to all agrotech topics (wildcard)
  mqttClient.subscribe('agrotech/+/sensores/#', { qos: 0 });
  mqttClient.subscribe('agrotech/+/status/#',   { qos: 1 });

  mqttClient.on('message', async (topic, rawPayload) => {
    let payload: unknown;
    try {
      payload = JSON.parse(rawPayload.toString());
    } catch {
      logger.warn('Invalid JSON from MQTT', { topic });
      return;
    }

    const parts = topic.split('/'); // ['agrotech', '{ghId}', '{category}', '{subcategory}']
    if (parts.length < 4 || parts[0] !== 'agrotech') return;

    const [, greenhouseId, category, subcategory] = parts;

    try {
      switch (`${category}/${subcategory}`) {
        case 'sensores/estado':
          await handleSensorData(greenhouseId, payload as SensorPayload, io);
          break;

        case 'status/atuadores':
          await handleActuatorStatus(greenhouseId, payload as ActuatorStatusPayload, io);
          break;

        case 'status/sistema':
          await handleHeartbeat(greenhouseId, payload as HeartbeatPayload, io);
          break;

        default:
          logger.debug('Unhandled MQTT topic', { topic });
      }
    } catch (err) {
      logger.error('MQTT handler error', { topic, err });
    }
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
      io.to(greenhouseId).emit('alert:critical', {
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

  // Broadcast to dashboard via Socket.IO
  io.to(greenhouseId).emit('sensor:update', {
    ...data,
    greenhouseId,
    timestamp: new Date().toISOString(),
  });

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

  io.to(greenhouseId).emit('actuator:update', { ...data, greenhouseId });
}

async function handleHeartbeat(
  greenhouseId: string,
  data: HeartbeatPayload,
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>
) {
  // Store heartbeat timestamp in Redis with TTL (RN11)
  await redis.setex(HEARTBEAT_KEY(greenhouseId), HEARTBEAT_TTL, Date.now().toString());

  io.to(greenhouseId).emit('heartbeat:update', { ...data, greenhouseId });

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
      condition: data.temp > 35 || data.temp < 5,
      key: `anomaly:temp:${greenhouseId}`,
      type: 'TEMP_CRITICAL',
      msg: `Temperature out of safe range: ${data.temp}°C`,
    },
    {
      condition: data.umid_solo < 15,
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
            io.to(greenhouseId).emit('alert:critical', {
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
        io.to(id).emit('greenhouse:offline', { greenhouseId: id, since: new Date().toISOString() });
        io.to(id).emit('alert:critical', {
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
