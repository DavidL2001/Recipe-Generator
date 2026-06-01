// ── User ────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// ── Auth ────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ── Ingredient ──────────────────────────────────────────
export interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
}

// ── Recipe ──────────────────────────────────────────────
export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition?: NutritionInfo;
  tags?: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'lätt' | 'medel' | 'svår';
  isFavorite: boolean;
  createdAt: string;
}

// ── Nutrition ───────────────────────────────────────────
export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

// ── Meal Plan ───────────────────────────────────────────
export type MealType = 'frukost' | 'lunch' | 'middag' | 'mellanmål';

export interface MealPlanDay {
  id: string;
  mealPlanId?: string;
  dayOfWeek: number;
  mealType: MealType;
  recipeId?: string;
  recipe: Recipe;
}

export interface MealPlan {
  id: string;
  userId?: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt?: string;
  days: MealPlanDay[];
}

// ── API ──────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
}

// ── AI Recipe Generation ─────────────────────────────────
export type OptimizationGoal = 'balanserad' | 'protein' | 'budget' | 'lågCarb' | 'vegetarian';

export interface RecipeGenerationRequest {
  ingredients: string[];
  goal?: OptimizationGoal;
  servings?: number;
  cuisine?: string;
  excludeAllergens?: string[];
}

// ── User Ingredient (persisted) ──────────────────────────
export interface UserIngredient {
  id: string;
  userId: string;
  name: string;
  amount?: string;
  unit?: string;
  createdAt: string;
}

export interface CreateIngredientPayload {
  name: string;
  amount?: string;
  unit?: string;
}

export interface UpdateIngredientPayload {
  name?: string;
  amount?: string;
  unit?: string;
}
