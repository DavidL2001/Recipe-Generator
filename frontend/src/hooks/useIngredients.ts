import { useState, useEffect, useCallback } from 'react';
import * as ingredientService from '@/services/ingredientService';
import type {
  UserIngredient,
  CreateIngredientPayload,
  UpdateIngredientPayload,
} from '@/types';

interface UseIngredientsReturn {
  ingredients: UserIngredient[];
  isLoading: boolean;
  error: string | null;
  fetchIngredients: () => Promise<void>;
  addIngredient: (payload: CreateIngredientPayload) => Promise<UserIngredient | null>;
  editIngredient: (id: string, payload: UpdateIngredientPayload) => Promise<UserIngredient | null>;
  removeIngredient: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  clearError: () => void;
}

export const useIngredients = (): UseIngredientsReturn => {
  const [ingredients, setIngredients] = useState<UserIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown, fallback: string) => {
    const msg =
      (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? fallback;
    setError(msg);
  };

  const clearError = () => setError(null);

  // ── Fetch ─────────────────────────────────────────────
  const fetchIngredients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ingredientService.getIngredients();
      setIngredients(data);
    } catch (err) {
      handleError(err, 'Failed to load ingredients');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Add ───────────────────────────────────────────────
  const addIngredient = async (
    payload: CreateIngredientPayload
  ): Promise<UserIngredient | null> => {
    setError(null);
    try {
      const created = await ingredientService.createIngredient(payload);
      setIngredients((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      handleError(err, 'Failed to add ingredient');
      return null;
    }
  };

  // ── Edit ──────────────────────────────────────────────
  const editIngredient = async (
    id: string,
    payload: UpdateIngredientPayload
  ): Promise<UserIngredient | null> => {
    setError(null);
    try {
      const updated = await ingredientService.updateIngredient(id, payload);
      setIngredients((prev) =>
        prev.map((i) => (i.id === id ? updated : i))
      );
      return updated;
    } catch (err) {
      handleError(err, 'Failed to update ingredient');
      return null;
    }
  };

  // ── Remove ────────────────────────────────────────────
  const removeIngredient = async (id: string): Promise<void> => {
    setError(null);
    // Optimistic update
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    try {
      await ingredientService.deleteIngredient(id);
    } catch (err) {
      // Roll back on failure
      await fetchIngredients();
      handleError(err, 'Failed to delete ingredient');
    }
  };

  // ── Clear all ─────────────────────────────────────────
  const clearAll = async (): Promise<void> => {
    setError(null);
    try {
      await ingredientService.clearIngredients();
      setIngredients([]);
    } catch (err) {
      handleError(err, 'Failed to clear ingredients');
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  return {
    ingredients,
    isLoading,
    error,
    fetchIngredients,
    addIngredient,
    editIngredient,
    removeIngredient,
    clearAll,
    clearError,
  };
};
