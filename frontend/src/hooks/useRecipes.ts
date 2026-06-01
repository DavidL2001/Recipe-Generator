import { useState, useEffect, useCallback } from 'react';
import * as recipeService from '@/services/recipeService';
import type { Recipe, RecipeGenerationRequest } from '@/types';

interface UseRecipesReturn {
  recipes: Recipe[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  fetchRecipes: () => Promise<void>;
  generateRecipe: (req: RecipeGenerationRequest) => Promise<Recipe | null>;
  favoriteRecipe: (id: string) => Promise<void>;
  removeRecipe: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useRecipes = (): UseRecipesReturn => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown, fallback: string) => {
    const msg =
      (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? fallback;
    setError(msg);
  };

  const clearError = () => setError(null);

  // ── Fetch ─────────────────────────────────────────────
  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await recipeService.getRecipes();
      setRecipes(data);
    } catch (err) {
      handleError(err, 'Failed to load recipes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Generate ──────────────────────────────────────────
  const generateWithRetry = async (
    req: RecipeGenerationRequest,
    retries = 1
  ): Promise<import('@/types').Recipe> => {
    try {
      return await recipeService.generateRecipe(req);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (retries > 0 && (status === 503 || status === 429)) {
        await new Promise((r) => setTimeout(r, 2000));
        return generateWithRetry(req, retries - 1);
      }
      throw err;
    }
  };

  const generateRecipe = async (
    req: RecipeGenerationRequest
  ): Promise<Recipe | null> => {
    setIsGenerating(true);
    setError(null);
    try {
      const recipe = await generateWithRetry(req);
      // Prepend to list (already saved server-side)
      setRecipes((prev) => [recipe, ...prev]);
      return recipe;
    } catch (err) {
      handleError(err, 'Failed to generate recipe');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Toggle favorite ───────────────────────────────────
  const favoriteRecipe = async (id: string): Promise<void> => {
    // Optimistic update
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
    try {
      const updated = await recipeService.toggleFavorite(id);
      setRecipes((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      await fetchRecipes(); // Roll back
      handleError(err, 'Failed to update favorite');
    }
  };

  // ── Delete ────────────────────────────────────────────
  const removeRecipe = async (id: string): Promise<void> => {
    // Optimistic update
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    try {
      await recipeService.deleteRecipe(id);
    } catch (err) {
      await fetchRecipes(); // Roll back
      handleError(err, 'Failed to delete recipe');
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return {
    recipes,
    isLoading,
    isGenerating,
    error,
    fetchRecipes,
    generateRecipe,
    favoriteRecipe,
    removeRecipe,
    clearError,
  };
};
