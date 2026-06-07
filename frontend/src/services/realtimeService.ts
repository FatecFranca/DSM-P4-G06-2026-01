import { Greenhouse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

type SocketHandler<T = unknown> = (payload: T) => void;

interface SocketLike {
  on: (event: string, handler: SocketHandler) => void;
  off: (event: string, handler: SocketHandler) => void;
  emit: (event: string, payload?: unknown) => void;
  disconnect: () => void;
}

type SocketFactory = (url: string, options?: Record<string, unknown>) => SocketLike;

declare global {
  interface Window {
    io?: SocketFactory;
  }
}

let socketClientPromise: Promise<SocketFactory | undefined> | null = null;

function loadSocketClient() {
  if (window.io) return Promise.resolve(window.io);

  if (!socketClientPromise) {
    socketClientPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${API_BASE}/socket.io/socket.io.js`;
      script.async = true;
      script.onload = () => resolve(window.io);
      script.onerror = () => reject(new Error('Socket.IO indisponivel.'));
      document.head.appendChild(script);
    });
  }

  return socketClientPromise;
}

export async function subscribeToGreenhouseTelemetry(
  token: string,
  greenhouseIds: string[],
  onTelemetry: (payload: TelemetryPayload) => void,
  onRuntimeMetrics?: (payload: RuntimeMetricsSnapshot) => void,
  onStatus?: (status: RealtimeStatus) => void
) {
  const io = await loadSocketClient();
  if (!io) throw new Error('Socket.IO indisponivel.');

  const socket = io(API_BASE, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
  });

  const uniqueGreenhouseIds = Array.from(new Set(greenhouseIds));
  const handleTelemetry: SocketHandler<TelemetryPayload> = (payload) => onTelemetry(payload);
  const handleRuntimeMetrics: SocketHandler<RuntimeMetricsSnapshot> = (payload) => onRuntimeMetrics?.(payload);
  const handleConnect = () => {
    uniqueGreenhouseIds.forEach((greenhouseId) => {
      socket.emit('subscribe:greenhouse', greenhouseId);
    });
    onStatus?.('connected');
  };
  const handleDisconnect = () => onStatus?.('disconnected');

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on('sensor:update', handleTelemetry as SocketHandler);
  socket.on('telemetry:update', handleTelemetry as SocketHandler);
  socket.on('greenhouse:update', handleTelemetry as SocketHandler);
  socket.on('runtime:metrics', handleRuntimeMetrics as SocketHandler);

  return () => {
    uniqueGreenhouseIds.forEach((greenhouseId) => {
      socket.emit('unsubscribe:greenhouse', greenhouseId);
    });
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
    socket.off('sensor:update', handleTelemetry as SocketHandler);
    socket.off('telemetry:update', handleTelemetry as SocketHandler);
    socket.off('greenhouse:update', handleTelemetry as SocketHandler);
    socket.off('runtime:metrics', handleRuntimeMetrics as SocketHandler);
    socket.disconnect();
  };
}
