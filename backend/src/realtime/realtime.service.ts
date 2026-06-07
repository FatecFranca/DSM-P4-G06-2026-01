import { Server as SocketServer } from 'socket.io';
import {
  ActuatorStatusPayload,
  ClientToServerEvents,
  HeartbeatPayload,
  SensorPayload,
  ServerToClientEvents,
} from '../types';

export type RealtimeServer = SocketServer<ClientToServerEvents, ServerToClientEvents>;

export function emitSensorTelemetry(
  io: RealtimeServer,
  greenhouseId: string,
  data: SensorPayload,
  timestamp = new Date().toISOString()
) {
  const telemetry = {
    ...data,
    greenhouseId,
    timestamp,
  };

  io.to(greenhouseId).emit('sensor:update', telemetry);
  io.to(greenhouseId).emit('telemetry:update', telemetry);
  io.to(greenhouseId).emit('greenhouse:update', {
    greenhouseId,
    latestTelemetry: {
      ...data,
      timestamp,
    },
  });

  return telemetry;
}

export function emitActuatorStatus(
  io: RealtimeServer,
  greenhouseId: string,
  data: ActuatorStatusPayload
) {
  io.to(greenhouseId).emit('actuator:update', { ...data, greenhouseId });
}

export function emitHeartbeat(
  io: RealtimeServer,
  greenhouseId: string,
  data: HeartbeatPayload
) {
  io.to(greenhouseId).emit('heartbeat:update', { ...data, greenhouseId });
}

export function emitCriticalAlert(
  io: RealtimeServer,
  data: { id: string; greenhouseId: string; type: string; message: string }
) {
  io.to(data.greenhouseId).emit('alert:critical', data);
}

export function emitGreenhouseOffline(
  io: RealtimeServer,
  greenhouseId: string,
  since = new Date().toISOString()
) {
  io.to(greenhouseId).emit('greenhouse:offline', { greenhouseId, since });
}
