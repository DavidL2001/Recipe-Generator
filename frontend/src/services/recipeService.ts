import api from './api';
import type { ApiResponse, Recipe, RecipeGenerationRequest } from '@/types';

const BASE = '/api/recipes';

// ── Generate + auto-save ─────────────────────────────────
export const generateRecipe = async (
  payload: RecipeGenerationRequest
): Promise<Recipe> => {
  const { data } = await api.post<ApiResponse<{ recipe: Recipe }>>(
    `${BASE}/generate`,
    payload
  );
  return data.data!.recipe;
};

// ── List all (lightweight) ───────────────────────────────
export const getRecipes = async (): Promise<Recipe[]> => {
  const { data } = await api.get<ApiResponse<{ recipes: Recipe[] }>>(BASE);
  return data.data?.recipes ?? [];
};

// ── Get full detail ──────────────────────────────────────
export const getRecipeById = async (id: string): Promise<Recipe> => {
  const { data } = await api.get<ApiResponse<{ recipe: Recipe }>>(`${BASE}/${id}`);
  return data.data!.recipe;
};

// ── Toggle favorite ──────────────────────────────────────
export const toggleFavorite = async (id: string): Promise<Recipe> => {
  const { data } = await api.patch<ApiResponse<{ recipe: Recipe }>>(
    `${BASE}/${id}/favorite`
  );
  return data.data!.recipe;
};

// ── Delete ───────────────────────────────────────────────
export const deleteRecipe = async (id: string): Promise<void> => {
  await api.delete(`${BASE}/${id}`);
};
