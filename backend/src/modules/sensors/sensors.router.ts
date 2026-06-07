// src/modules/sensors/sensors.router.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SensorsService } from './sensors.service';
import { authenticate } from '../../middlewares/auth';

const router = Router();
const svc = new SensorsService();

const historySchema = z.object({
  start: z.string().default('-24h'),
  end: z.string().default('now()'),
  window: z.string().default('5m'),
});

// GET /sensors/:greenhouseId/latest
router.get('/:greenhouseId/latest', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await svc.getLatest(req.params.greenhouseId);
    if (!data) { res.status(404).json({ error: 'No readings found' }); return; }
    res.json(data);
  } catch (err) { next(err); }
});

// GET /sensors/:greenhouseId/history?start=-24h&end=now()&window=5m
router.get('/:greenhouseId/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end, window } = historySchema.parse(req.query);
    const data = await svc.getHistory(req.params.greenhouseId, start, end, window);
    res.json({ data, count: data.length });
  } catch (err) { next(err); }
});

export { router as sensorsRouter };
