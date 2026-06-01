import api from './api';
import type { MealPlan, MealType } from '@/types';

export interface MealPlanDayPayload {
  dayOfWeek: number;
  mealType: MealType;
  recipeId: string;
}

export interface CreateMealPlanPayload {
  name: string;
  startDate: string;
  endDate: string;
  days: MealPlanDayPayload[];
}

export interface UpdateMealPlanPayload {
  name?: string;
  startDate?: string;
  endDate?: string;
  days?: MealPlanDayPayload[];
}

export const getMealPlans = async (): Promise<MealPlan[]> => {
  const res = await api.get('/api/meal-plans');
  return res.data.data.mealPlans;
};

export const getMealPlanById = async (id: string): Promise<MealPlan> => {
  const res = await api.get(`/api/meal-plans/${id}`);
  return res.data.data.mealPlan;
};

export const createMealPlan = async (payload: CreateMealPlanPayload): Promise<MealPlan> => {
  const res = await api.post('/api/meal-plans', payload);
  return res.data.data.mealPlan;
};

export const updateMealPlan = async (
  id: string,
  payload: UpdateMealPlanPayload
): Promise<MealPlan> => {
  const res = await api.patch(`/api/meal-plans/${id}`, payload);
  return res.data.data.mealPlan;
};

export const deleteMealPlan = async (id: string): Promise<void> => {
  await api.delete(`/api/meal-plans/${id}`);
};
