import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as mealPlanService from '../services/mealPlanService';
import { sendSuccess } from '../utils/apiResponse';
import { createError } from '../utils/createError';

// ── Validation schemas ───────────────────────────────────

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  recipeId: z.string().min(1),
});

const createSchema = z.object({
  name: z.string().min(1).max(100),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  days: z.array(daySchema).max(50).default([]),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  days: z.array(daySchema).max(50).optional(),
});

// ── GET /api/meal-plans ──────────────────────────────────

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));
    const plans = await mealPlanService.getMealPlans(req.user.id);
    sendSuccess(res, { mealPlans: plans });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/meal-plans/:id ──────────────────────────────

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));
    const plan = await mealPlanService.getMealPlanById(req.params.id, req.user.id);
    sendSuccess(res, { mealPlan: plan });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/meal-plans ─────────────────────────────────

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 422));
    }

    const plan = await mealPlanService.createMealPlan(req.user.id, parsed.data);
    sendSuccess(res, { mealPlan: plan }, 201);
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/meal-plans/:id ────────────────────────────

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 422));
    }

    const plan = await mealPlanService.updateMealPlan(req.params.id, req.user.id, parsed.data);
    sendSuccess(res, { mealPlan: plan });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/meal-plans/:id ───────────────────────────

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));
    await mealPlanService.deleteMealPlan(req.params.id, req.user.id);
    sendSuccess(res, null, 204);
  } catch (err) {
    next(err);
  }
};
