import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as ingredientService from '../services/ingredientService';
import { sendSuccess } from '../utils/apiResponse';
import { createError } from '../utils/createError';

// ── Validation schemas ───────────────────────────────────
const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.string().max(50).optional(),
  unit: z.string().max(30).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.string().max(50).optional(),
  unit: z.string().max(30).optional(),
}).refine((d) => Object.keys(d).length > 0, {
  message: 'At least one field must be provided',
});

// ── GET /api/ingredients ─────────────────────────────────
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));

    const ingredients = await ingredientService.getIngredients(req.user.id);
    sendSuccess(res, { ingredients });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/ingredients/:id ─────────────────────────────
export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));

    const ingredient = await ingredientService.getIngredientById(
      req.params.id,
      req.user.id
    );
    sendSuccess(res, { ingredient });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/ingredients ────────────────────────────────
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 422));
    }

    const ingredient = await ingredientService.createIngredient(
      req.user.id,
      parsed.data
    );
    sendSuccess(res, { ingredient }, 201);
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/ingredients/:id ───────────────────────────
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 422));
    }

    const ingredient = await ingredientService.updateIngredient(
      req.params.id,
      req.user.id,
      parsed.data
    );
    sendSuccess(res, { ingredient });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/ingredients/:id ──────────────────────────
export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));

    await ingredientService.deleteIngredient(req.params.id, req.user.id);
    sendSuccess(res, null, 204);
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/ingredients ──────────────────────────────
export const clearAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));

    const result = await ingredientService.clearIngredients(req.user.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};
