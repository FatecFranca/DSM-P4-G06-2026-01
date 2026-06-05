// src/server.ts
import './config/env'; // validate env first
import { env } from './config/env';
import http from 'http';
import { logger } from './config/logger';
import { prisma, closeConnections } from './config/database';
import { createApp } from './app';
import { connectMqtt } from './mqtt/mqtt.client';
import { setupMqttHandlers, checkHeartbeats } from './mqtt/mqtt.handler';
import { createSocketServer } from './realtime/socket.server';


console.log('MQTT_CLIENT_ID:', env.MQTT_CLIENT_ID);
console.log('MQTT_URL:', env.MQTT_URL);

async function bootstrap() {
  // ─── Test DB connection ────────────────────────────────────────────────────
  await prisma.$connect();
  logger.info('PostgreSQL connected');

  // ─── HTTP server ───────────────────────────────────────────────────────────
  const app = createApp();
  const httpServer = http.createServer(app);

  // ─── Socket.IO ─────────────────────────────────────────────────────────────
  const io = createSocketServer(httpServer);
  logger.info('Socket.IO initialized');

  // ─── MQTT ──────────────────────────────────────────────────────────────────
  const mqttClient = connectMqtt();
  setupMqttHandlers(mqttClient, io);
  logger.info('MQTT handlers registered');

  // ─── Heartbeat watchdog (RN11) — check every 5 min ────────────────────────
  const heartbeatInterval = setInterval(() => checkHeartbeats(io), 5 * 60 * 1000);

  // ─── Listen ────────────────────────────────────────────────────────────────
  httpServer.listen(Number(env.PORT), () => {
    logger.info(`AgroTech backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // ─── Graceful shutdown ─────────────────────────────────────────────────────
  async function shutdown(signal: string) {
    logger.info(`Received ${signal}, shutting down...`);
    clearInterval(heartbeatInterval);
    mqttClient.end();
    httpServer.close(async () => {
      await closeConnections();
      logger.info('Shutdown complete');
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err });
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
  });
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
