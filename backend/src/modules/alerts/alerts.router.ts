// src/modules/alerts/alerts.router.ts
import { Router, Request, Response, NextFunction } from 'express';
import { AlertsService } from './alerts.service';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import { AuthenticatedRequest } from '../../types';

const router = Router();
const svc = new AlertsService();

// GET /alerts?greenhouseId=&status=OPEN
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { greenhouseId, status } = req.query as Record<string, string>;
    res.json(await svc.list(greenhouseId, status));
  } catch (err) { next(err); }
});

// PATCH /alerts/:id/acknowledge — ADMIN only
router.patch('/:id/acknowledge', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.acknowledge(req.params.id, req.user!.id));
  } catch (err) { next(err); }
});

// PATCH /alerts/:id/resolve — ADMIN only
router.patch('/:id/resolve', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.resolve(req.params.id));
  } catch (err) { next(err); }
});

export { router as alertsRouter };
