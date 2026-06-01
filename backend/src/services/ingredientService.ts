import { prisma } from '../config/database';
import { createError } from '../utils/createError';

// ── Types ────────────────────────────────────────────────
export interface CreateIngredientInput {
  name: string;
  amount?: string;
  unit?: string;
}

export interface UpdateIngredientInput {
  name?: string;
  amount?: string;
  unit?: string;
}

// ── Get all ingredients for a user ───────────────────────
export const getIngredients = async (userId: string) => {
  return prisma.ingredient.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

// ── Get single ingredient (ownership enforced) ───────────
export const getIngredientById = async (id: string, userId: string) => {
  const ingredient = await prisma.ingredient.findUnique({ where: { id } });

  if (!ingredient) throw createError('Ingredient not found', 404);
  if (ingredient.userId !== userId) throw createError('Forbidden', 403);

  return ingredient;
};

// ── Create ───────────────────────────────────────────────
export const createIngredient = async (
  userId: string,
  input: CreateIngredientInput
) => {
  return prisma.ingredient.create({
    data: { userId, ...input },
  });
};

// ── Update ───────────────────────────────────────────────
export const updateIngredient = async (
  id: string,
  userId: string,
  input: UpdateIngredientInput
) => {
  // Verify ownership first
  await getIngredientById(id, userId);

  return prisma.ingredient.update({
    where: { id },
    data: input,
  });
};

// ── Delete ───────────────────────────────────────────────
export const deleteIngredient = async (id: string, userId: string) => {
  // Verify ownership first
  await getIngredientById(id, userId);

  await prisma.ingredient.delete({ where: { id } });
};

// ── Bulk delete (clear all for a user) ───────────────────
export const clearIngredients = async (userId: string) => {
  const { count } = await prisma.ingredient.deleteMany({ where: { userId } });
  return { deleted: count };
};
