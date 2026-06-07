import { redis } from '../config/database';

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

const WINDOW_SIZE = 300;

let messagesTotal = 0;
let messagesSuccess = 0;
let messagesFailed = 0;
let windowStartedAt = Date.now();
let windowMessages = 0;
const latencies: number[] = [];
let latestLatency: number | null = null;

function readTimestamp(payload: unknown): number | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const data = payload as Record<string, unknown>;
  const raw = data.sentAt ?? data.sent_at ?? data.timestamp ?? data.ts ?? data.deviceTimestamp;

  if (typeof raw === 'number' && Number.isFinite(raw)) return raw > 10_000_000_000 ? raw : raw * 1000;
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function percentile(values: number[], target: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((target / 100) * sorted.length) - 1);
  return sorted[index];
}

function readRedisNumber(info: string, key: string) {
  const line = info.split('\n').find((item) => item.startsWith(`${key}:`));
  if (!line) return null;
  const parsed = Number(line.split(':')[1]?.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

async function readInfluxHealth() {
  try {
    const url = process.env.INFLUX_URL ? `${process.env.INFLUX_URL}/health` : '';
    if (!url) return 'unknown' as const;
    const response = await fetch(url);
    return response.ok ? 'pass' as const : 'fail' as const;
  } catch {
    return 'fail' as const;
  }
}

export function observeMqttMessage(payload: unknown, success: boolean) {
  messagesTotal += 1;
  windowMessages += 1;

  if (success) messagesSuccess += 1;
  else messagesFailed += 1;

  const sentAt = readTimestamp(payload);
  if (sentAt !== null) {
    latestLatency = Math.max(0, Date.now() - sentAt);
    latencies.push(latestLatency);
    if (latencies.length > WINDOW_SIZE) latencies.shift();
  }
}

export async function getRuntimeMetricsSnapshot(): Promise<RuntimeMetricsSnapshot> {
  const now = Date.now();
  const elapsedSeconds = Math.max(1, (now - windowStartedAt) / 1000);
  const messagesPerSecond = windowMessages / elapsedSeconds;

  if (elapsedSeconds >= 1) {
    windowStartedAt = now;
    windowMessages = 0;
  }

  let redisUsedMemoryBytes: number | null = null;
  let redisUsedMemoryPeakBytes: number | null = null;
  try {
    const info = await redis.info('memory');
    redisUsedMemoryBytes = readRedisNumber(info, 'used_memory');
    redisUsedMemoryPeakBytes = readRedisNumber(info, 'used_memory_peak');
  } catch {
    redisUsedMemoryBytes = null;
    redisUsedMemoryPeakBytes = null;
  }

  const processMemory = process.memoryUsage();
  const influxHealth = await readInfluxHealth();

  return {
    timestamp: new Date(now).toISOString(),
    mqtt: {
      messagesTotal,
      messagesSuccess,
      messagesFailed,
      messagesPerSecond,
      successRate: messagesTotal === 0 ? 0 : messagesSuccess / messagesTotal,
      latencyMs: {
        latest: latestLatency,
        p95: percentile(latencies, 95),
        p99: percentile(latencies, 99),
        samples: latencies.length,
      },
    },
    memory: {
      backendRssBytes: processMemory.rss,
      backendHeapUsedBytes: processMemory.heapUsed,
      redisUsedMemoryBytes,
      redisUsedMemoryPeakBytes,
      influxHealth,
    },
  };
}
