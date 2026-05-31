// src/modules/greenhouses/greenhouses.router.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GreenhousesService } from './greenhouses.service';
import { authenticate, requireAdmin } from '../../middlewares/auth';

const router = Router();
const svc = new GreenhousesService();

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

const configSchema = z.object({
  t_max: z.number().min(0).max(60).optional(),
  t_min: z.number().min(0).max(60).optional(),
  u_solo_min: z.number().min(0).max(100).optional(),
  u_solo_max: z.number().min(0).max(100).optional(),
  t_rega_max: z.number().int().min(10).max(3600).optional(),
  luz_on: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  luz_off: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// GET /greenhouses
router.get('/', authenticate, async (_req, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.list());
  } catch (err) { next(err); }
});

// GET /greenhouses/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await svc.findById(req.params.id));
  } catch (err) {
    if (err instanceof Error && err.message === 'Greenhouse not found') {
      res.status(404).json({ error: err.message }); return;
    }
    next(err);
  }
});

// POST /greenhouses — ADMIN only
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = createSchema.parse(req.body);
    res.status(201).json(await svc.create(name, description));
  } catch (err) { next(err); }
});

// PATCH /greenhouses/:id/config — ADMIN only (RN13)
router.patch('/:id/config', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = configSchema.parse(req.body);
    res.json(await svc.updateConfig(req.params.id, payload));
  } catch (err) { next(err); }
});

// DELETE /greenhouses/:id — ADMIN only
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.deactivate(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export { router as greenhousesRouter };
