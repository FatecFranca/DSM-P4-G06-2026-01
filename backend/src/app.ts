// src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middlewares/errorHandler';
import { authRouter } from './modules/auth/auth.router';
import { greenhousesRouter } from './modules/greenhouses/greenhouses.router';
import { sensorsRouter } from './modules/sensors/sensors.router';
import { actuatorsRouter } from './modules/actuators/actuators.router';
import { alertsRouter } from './modules/alerts/alerts.router';
import { analyticsRouter } from './modules/analytics/analytics.router';

export function createApp() {
  const app = express();

  // ─── Security ───────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }));
  app.use(rateLimit({
    windowMs: Number(env.RATE_LIMIT_WINDOW_MS),
    max: Number(env.RATE_LIMIT_MAX),
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // ─── Body parsing ───────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Request logging ───────────────────────────────────────────────────────
  app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
      logger.info('HTTP request', {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration_ms: Date.now() - startTime,
        ip: req.ip,
        query: req.query,
        params: req.params,
        body: req.body,
      });
    });
    next();
  });

  // ─── Health ─────────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
  });

  // ─── Routes ─────────────────────────────────────────────────────────────────
  app.use('/auth',        authRouter);
  app.use('/greenhouses', greenhousesRouter);
  app.use('/sensors',     sensorsRouter);
  app.use('/actuators',   actuatorsRouter);
  app.use('/alerts',      alertsRouter);
  app.use('/analytics',   analyticsRouter);

  // ─── 404 ────────────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // ─── Error handler ──────────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
