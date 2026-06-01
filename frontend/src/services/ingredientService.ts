import api from './api';
import type {
  ApiResponse,
  UserIngredient,
  CreateIngredientPayload,
  UpdateIngredientPayload,
} from '@/types';

const BASE = '/api/ingredients';

// ── List all ─────────────────────────────────────────────
export const getIngredients = async (): Promise<UserIngredient[]> => {
  const { data } = await api.get<ApiResponse<{ ingredients: UserIngredient[] }>>(BASE);
  return data.data?.ingredients ?? [];
};

// ── Create ───────────────────────────────────────────────
export const createIngredient = async (
  payload: CreateIngredientPayload
): Promise<UserIngredient> => {
  const { data } = await api.post<ApiResponse<{ ingredient: UserIngredient }>>(
    BASE,
    payload
  );
  return data.data!.ingredient;
};

// ── Update ───────────────────────────────────────────────
export const updateIngredient = async (
  id: string,
  payload: UpdateIngredientPayload
): Promise<UserIngredient> => {
  const { data } = await api.patch<ApiResponse<{ ingredient: UserIngredient }>>(
    `${BASE}/${id}`,
    payload
  );
  return data.data!.ingredient;
};

// ── Delete single ─────────────────────────────────────────
export const deleteIngredient = async (id: string): Promise<void> => {
  await api.delete(`${BASE}/${id}`);
};

// ── Clear all ────────────────────────────────────────────
export const clearIngredients = async (): Promise<{ deleted: number }> => {
  const { data } = await api.delete<ApiResponse<{ deleted: number }>>(BASE);
  return data.data ?? { deleted: 0 };
};
