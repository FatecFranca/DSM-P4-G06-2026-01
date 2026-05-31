// src/modules/analytics/analytics.router.ts
import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { authenticate } from '../../middlewares/auth';

const router = Router();
const svc = new AnalyticsService();

// GET /analytics/:greenhouseId/kpis?start=-7d
router.get('/:greenhouseId/kpis', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start } = req.query as { start?: string };
    res.json(await svc.getKpis(req.params.greenhouseId, start));
  } catch (err) { next(err); }
});

// GET /analytics/:greenhouseId/temperature?start=-24h
router.get('/:greenhouseId/temperature', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start } = req.query as { start?: string };
    res.json(await svc.getTemperatureChart(req.params.greenhouseId, start));
  } catch (err) { next(err); }
});

// GET /analytics/:greenhouseId/soil-moisture?start=-7d
router.get('/:greenhouseId/soil-moisture', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start } = req.query as { start?: string };
    res.json(await svc.getSoilMoistureChart(req.params.greenhouseId, start));
  } catch (err) { next(err); }
});

export { router as analyticsRouter };
