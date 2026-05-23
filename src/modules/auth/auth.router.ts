// src/modules/auth/auth.router.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import { AuthenticatedRequest } from '../../types';

const router = Router();
const svc = new AuthService();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MONITOR']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /auth/register — ADMIN only
router.post('/register', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = registerSchema.parse(req.body);
    const user = await svc.register(name, email, password, role);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login — public
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await svc.login(email, password);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'Invalid credentials') {
      res.status(401).json({ error: err.message });
      return;
    }
    next(err);
  }
});

// GET /auth/me
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// GET /auth/users — ADMIN only
router.get('/users', authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await svc.listUsers();
    res.json({ users });
  } catch (err) { next(err); }
});

// PATCH /auth/users/:id/role — ADMIN only
router.patch('/users/:id/role', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = z.object({ role: z.enum(['ADMIN', 'MONITOR']) }).parse(req.body);
    const user = await svc.updateUserRole(req.params.id, role);
    res.json({ user });
  } catch (err) { next(err); }
});

export { router as authRouter };
