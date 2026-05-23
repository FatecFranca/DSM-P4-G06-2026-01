// src/modules/actuators/actuators.router.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ActuatorsService } from './actuators.service';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import { AuthenticatedRequest } from '../../types';

const router = Router();
const svc = new ActuatorsService();

const commandSchema = z.object({
  state: z.boolean(),
  timeoutSecs: z.number().int().min(60).max(86400).optional(),
});

// GET /actuators/:greenhouseId
router.get('/:greenhouseId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.listByGreenhouse(req.params.greenhouseId));
  } catch (err) { next(err); }
});

// POST /actuators/:greenhouseId/:name/command — ADMIN only (RN13)
router.post(
  '/:greenhouseId/:name/command',
  authenticate,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { state, timeoutSecs } = commandSchema.parse(req.body);
      const result = await svc.command(
        req.params.greenhouseId,
        req.params.name,
        state,
        req.user!.id,
        req.user!.email,
        timeoutSecs
      );
      res.json(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        res.status(404).json({ error: err.message }); return;
      }
      next(err);
    }
  }
);

// GET /actuators/:greenhouseId/:actuatorId/logs
router.get('/:greenhouseId/:actuatorId/logs', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const take = Math.min(parseInt(req.query.take as string ?? '50'), 200);
    res.json(await svc.getLogs(req.params.actuatorId, take));
  } catch (err) { next(err); }
});

export { router as actuatorsRouter };
