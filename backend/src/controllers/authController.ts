import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/authService';
import { sendSuccess } from '../utils/apiResponse';
import { createError } from '../utils/createError';

// ── Validation schemas ───────────────────────────────────
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Register ─────────────────────────────────────────────
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        createError(parsed.error.errors[0].message, 422)
      );
    }

    const { email, password, name } = parsed.data;
    const result = await authService.register(email, password, name);

    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
};

// ── Login ────────────────────────────────────────────────
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        createError(parsed.error.errors[0].message, 422)
      );
    }

    const { email, password } = parsed.data;
    const result = await authService.login(email, password);

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

// ── Get Me ───────────────────────────────────────────────
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(createError('Unauthorized', 401));
    }

    const user = await authService.getMe(req.user.id);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
};
