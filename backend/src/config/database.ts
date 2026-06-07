// src/config/database.ts
import { PrismaClient } from '@prisma/client';
import { InfluxDB, WriteApi, QueryApi } from '@influxdata/influxdb-client';
import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// ─── Prisma ───────────────────────────────────────────────────────────────────
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development'
    ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
    : ['warn', 'error'],
});

// ─── InfluxDB ─────────────────────────────────────────────────────────────────
const influxClient = new InfluxDB({ url: env.INFLUX_URL, token: env.INFLUX_TOKEN });

export const influxWrite: WriteApi = influxClient.getWriteApi(
  env.INFLUX_ORG,
  env.INFLUX_BUCKET,
  'ns'
);
influxWrite.useDefaultTags({ app: 'agrotech' });

export const influxQuery: QueryApi = influxClient.getQueryApi(env.INFLUX_ORG);

// ─── Redis ────────────────────────────────────────────────────────────────────
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { err }));

// ─── Graceful shutdown ────────────────────────────────────────────────────────
export async function closeConnections() {
  await prisma.$disconnect();
  await influxWrite.close();
  redis.disconnect();
  logger.info('All DB connections closed');
}
