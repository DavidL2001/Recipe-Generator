import { useState, useEffect, useCallback } from 'react';
import * as mealPlanService from '@/services/mealPlanService';
import type { MealPlan } from '@/types';
import type {
  CreateMealPlanPayload,
  UpdateMealPlanPayload,
} from '@/services/mealPlanService';

interface UseMealPlansReturn {
  mealPlans: MealPlan[];
  isLoading: boolean;
  error: string | null;
  fetchMealPlans: () => Promise<void>;
  addMealPlan: (payload: CreateMealPlanPayload) => Promise<MealPlan | null>;
  editMealPlan: (id: string, payload: UpdateMealPlanPayload) => Promise<MealPlan | null>;
  removeMealPlan: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useMealPlans = (): UseMealPlansReturn => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown, fallback: string) => {
    const msg =
      (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? fallback;
    setError(msg);
  };

  const clearError = () => setError(null);

  const fetchMealPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mealPlanService.getMealPlans();
      setMealPlans(data);
    } catch (err) {
      handleError(err, 'Failed to load meal plans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMealPlan = async (
    payload: CreateMealPlanPayload
  ): Promise<MealPlan | null> => {
    setError(null);
    try {
      const plan = await mealPlanService.createMealPlan(payload);
      setMealPlans((prev) => [plan, ...prev]);
      return plan;
    } catch (err) {
      handleError(err, 'Failed to create meal plan');
      return null;
    }
  };

  const editMealPlan = async (
    id: string,
    payload: UpdateMealPlanPayload
  ): Promise<MealPlan | null> => {
    setError(null);
    try {
      const plan = await mealPlanService.updateMealPlan(id, payload);
      setMealPlans((prev) => prev.map((p) => (p.id === id ? plan : p)));
      return plan;
    } catch (err) {
      handleError(err, 'Failed to update meal plan');
      return null;
    }
  };

  const removeMealPlan = async (id: string) => {
    // Optimistic
    setMealPlans((prev) => prev.filter((p) => p.id !== id));
    try {
      await mealPlanService.deleteMealPlan(id);
    } catch (err) {
      await fetchMealPlans();
      handleError(err, 'Failed to delete meal plan');
    }
  };

  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  return {
    mealPlans,
    isLoading,
    error,
    fetchMealPlans,
    addMealPlan,
    editMealPlan,
    removeMealPlan,
    clearError,
  };
};
