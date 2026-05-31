// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof Error) {
    logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  logger.error('Unknown error', { err });
  res.status(500).json({ error: 'Internal server error' });
}
