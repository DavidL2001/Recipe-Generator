import { prisma } from '../config/database';
import { createError } from '../utils/createError';

// ── Types ────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlanDayInput {
  dayOfWeek: number;   // 0 = Monday … 6 = Sunday
  mealType: MealType;
  recipeId: string;
}

export interface CreateMealPlanInput {
  name: string;
  startDate: string;   // ISO date string
  endDate: string;
  days: MealPlanDayInput[];
}

export interface UpdateMealPlanInput {
  name?: string;
  startDate?: string;
  endDate?: string;
  days?: MealPlanDayInput[];
}

// ── Helpers ──────────────────────────────────────────────

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const assertValidMealType = (type: string): type is MealType =>
  MEAL_TYPES.includes(type as MealType);

// ── Service ──────────────────────────────────────────────

/** List all meal plans for a user (lightweight — no recipe details). */
export const getMealPlans = async (userId: string) => {
  return prisma.mealPlan.findMany({
    where: { userId },
    orderBy: { startDate: 'asc' },
    include: {
      days: {
        select: {
          id: true,
          dayOfWeek: true,
          mealType: true,
          recipeId: true,
          recipe: {
            select: { id: true, title: true, prepTime: true, cookTime: true, servings: true },
          },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
      },
    },
  });
};

/** Get a single meal plan (full). */
export const getMealPlanById = async (id: string, userId: string) => {
  const plan = await prisma.mealPlan.findUnique({
    where: { id },
    include: {
      days: {
        include: {
          recipe: true,
        },
        orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
      },
    },
  });
  if (!plan) throw createError('Meal plan not found', 404);
  if (plan.userId !== userId) throw createError('Forbidden', 403);
  return plan;
};

/** Create a new meal plan with optional day assignments. */
export const createMealPlan = async (
  userId: string,
  input: CreateMealPlanInput
) => {
  // Validate meal types
  for (const day of input.days) {
    if (!assertValidMealType(day.mealType)) {
      throw createError(`Invalid mealType: ${day.mealType}`, 422);
    }
    if (day.dayOfWeek < 0 || day.dayOfWeek > 6) {
      throw createError('dayOfWeek must be 0–6', 422);
    }
  }

  // Verify all referenced recipes belong to this user
  if (input.days.length > 0) {
    const recipeIds = [...new Set(input.days.map((d) => d.recipeId))];
    const owned = await prisma.recipe.findMany({
      where: { id: { in: recipeIds }, userId },
      select: { id: true },
    });
    if (owned.length !== recipeIds.length) {
      throw createError('One or more recipes not found or not yours', 404);
    }
  }

  return prisma.mealPlan.create({
    data: {
      userId,
      name: input.name,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      days: {
        create: input.days.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          mealType: d.mealType,
          recipeId: d.recipeId,
        })),
      },
    },
    include: {
      days: {
        include: { recipe: true },
        orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
      },
    },
  });
};

/** Update a meal plan's metadata and/or replace all its days. */
export const updateMealPlan = async (
  id: string,
  userId: string,
  input: UpdateMealPlanInput
) => {
  await getMealPlanById(id, userId); // Ownership check

  if (input.days) {
    for (const day of input.days) {
      if (!assertValidMealType(day.mealType)) {
        throw createError(`Invalid mealType: ${day.mealType}`, 422);
      }
    }
    // Delete existing days and re-create
    await prisma.mealPlanDay.deleteMany({ where: { mealPlanId: id } });
  }

  return prisma.mealPlan.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.startDate && { startDate: new Date(input.startDate) }),
      ...(input.endDate && { endDate: new Date(input.endDate) }),
      ...(input.days && {
        days: {
          create: input.days.map((d) => ({
            dayOfWeek: d.dayOfWeek,
            mealType: d.mealType,
            recipeId: d.recipeId,
          })),
        },
      }),
    },
    include: {
      days: {
        include: { recipe: true },
        orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
      },
    },
  });
};

/** Delete a meal plan (cascades days). */
export const deleteMealPlan = async (id: string, userId: string) => {
  await getMealPlanById(id, userId);
  await prisma.mealPlan.delete({ where: { id } });
};
