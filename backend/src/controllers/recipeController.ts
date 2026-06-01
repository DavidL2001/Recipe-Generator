import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as recipeService from '../services/recipeService';
import { sendSuccess } from '../utils/apiResponse';
import { createError } from '../utils/createError';

// ── Validation schemas ───────────────────────────────────

const generateSchema = z.object({
  ingredients: z
    .array(z.string().min(1).max(100))
    .min(1, 'At least one ingredient is required')
    .max(30, 'Maximum 30 ingredients'),
  goal: z
    .enum(['balanced', 'protein', 'budget', 'lowCarb', 'vegetarian'])
    .optional(),
  servings: z.number().int().min(1).max(20).optional(),
  cuisine: z.string().max(50).optional(),
  excludeAllergens: z.array(z.string().max(50)).max(10).optional(),
});

// ── POST /api/recipes/generate ───────────────────────────

export const generate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));

    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(parsed.error.errors[0].message, 422));
    }

    const generated = await recipeService.generateRecipe(parsed.data);

    // Auto-save after successful generation
    const saved = await recipeService.saveRecipe(
      req.user.id,
      generated,
      JSON.stringify(parsed.data)
    );

    sendSuccess(res, { recipe: saved }, 201);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/recipes ─────────────────────────────────────

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));

    const recipes = await recipeService.getRecipes(req.user.id);
    sendSuccess(res, { recipes });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/recipes/:id ─────────────────────────────────

export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));

    const recipe = await recipeService.getRecipeById(req.params.id, req.user.id);
    sendSuccess(res, { recipe });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/recipes/:id/favorite ──────────────────────

export const toggleFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));

    const recipe = await recipeService.toggleFavorite(req.params.id, req.user.id);
    sendSuccess(res, { recipe });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/recipes/:id ──────────────────────────────

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) return next(createError('Unauthorized', 401));

    await recipeService.deleteRecipe(req.params.id, req.user.id);
    sendSuccess(res, null, 204);
  } catch (err) {
    next(err);
  }
};
