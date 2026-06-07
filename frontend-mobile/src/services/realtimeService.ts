import { io, Socket } from 'socket.io-client';
import { Greenhouse } from '../types/greenhouse';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export type RealtimeStatus = 'connected' | 'disconnected';

export type TelemetryPayload = {
  greenhouseId?: string;
  id?: string;
  sensors?: Partial<Greenhouse['sensors']>;
  latestTelemetry?: Partial<Greenhouse['sensors']> & { timestamp?: string };
  temp?: number | null;
  temp_solo?: number | null;
  umid_ar?: number | null;
  umid_solo?: number | null;
  luz?: number | null;
  timestamp?: string;
};

export type RuntimeMetricsSnapshot = {
  timestamp: string;
  mqtt: {
    messagesTotal: number;
    messagesSuccess: number;
    messagesFailed: number;
    messagesPerSecond: number;
    successRate: number;
    latencyMs: {
      latest: number | null;
      p95: number | null;
      p99: number | null;
      samples: number;
    };
  };
  memory: {
    backendRssBytes: number;
    backendHeapUsedBytes: number;
    redisUsedMemoryBytes: number | null;
    redisUsedMemoryPeakBytes: number | null;
    influxHealth: 'pass' | 'fail' | 'unknown';
  };
};

export function subscribeToGreenhouseTelemetry(
  token: string,
  greenhouseIds: string[],
  onTelemetry: (payload: TelemetryPayload) => void,
  onRuntimeMetrics?: (payload: RuntimeMetricsSnapshot) => void,
  onStatus?: (status: RealtimeStatus) => void
) {
  const socket: Socket = io(API_BASE, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
  });

  const uniqueGreenhouseIds = Array.from(new Set(greenhouseIds));
  const subscribeRooms = () => {
    uniqueGreenhouseIds.forEach((greenhouseId) => {
      socket.emit('subscribe:greenhouse', greenhouseId);
    });
  };

  const handleConnect = () => {
    subscribeRooms();
    onStatus?.('connected');
  };
  const handleDisconnect = () => onStatus?.('disconnected');

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on('sensor:update', onTelemetry);
  socket.on('telemetry:update', onTelemetry);
  socket.on('greenhouse:update', onTelemetry);
  socket.on('runtime:metrics', (payload: RuntimeMetricsSnapshot) => onRuntimeMetrics?.(payload));

  return () => {
    uniqueGreenhouseIds.forEach((greenhouseId) => {
      socket.emit('unsubscribe:greenhouse', greenhouseId);
    });
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
    socket.off('sensor:update', onTelemetry);
    socket.off('telemetry:update', onTelemetry);
    socket.off('greenhouse:update', onTelemetry);
    socket.off('runtime:metrics');
    socket.disconnect();
  };
}
