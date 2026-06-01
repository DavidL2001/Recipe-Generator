# AI Recipe Generator — Handoff Pack Modul 6

## ✅ Status efter Modul 5

Modul 1 (projektsetup) ✓  
Modul 2 (Auth System) ✓  
Modul 3 (Ingredients CRUD) ✓  
Modul 4 (Recipe AI Generation) ✓  
**Modul 5 (Search, Tag Filters & Meal Plans) ✓** ← just nu klar

---

## 🏗 Vad Modul 5 byggde

### Backend

| Fil | Vad den gör |
|-----|-------------|
| `backend/src/services/mealPlanService.ts` | CRUD: `getMealPlans`, `getMealPlanById`, `createMealPlan`, `updateMealPlan`, `deleteMealPlan` |
| `backend/src/controllers/mealPlanController.ts` | Zod-validering + delegation (getAll, getOne, create, update, remove) |
| `backend/src/routes/mealPlans.ts` | REST-rutter med `authenticate` middleware på alla |
| `backend/src/index.ts` | `app.use('/api/meal-plans', mealPlanRoutes)` aktiverad |

### Frontend

| Fil | Vad den gör |
|-----|-------------|
| `frontend/src/services/mealPlanService.ts` | API-service: getMealPlans, getMealPlanById, createMealPlan, updateMealPlan, deleteMealPlan |
| `frontend/src/hooks/useMealPlans.ts` | React-hook: addMealPlan, editMealPlan, removeMealPlan (optimistisk), fetchMealPlans |
| `frontend/src/pages/MealPlanPage.tsx` | Full UI: planlista, skapaformulär, veckorutnät (7 dagar × 4 måltider), receptväljare modal |
| `frontend/src/pages/MealPlanPage.module.scss` | SCSS-modul, följer projektets design-tokens |
| `frontend/src/pages/RecipesPage.tsx` | **Uppdaterad** med sökfält + tag-filterchips |
| `frontend/src/pages/RecipesPage.module.scss` | **Utökad** med M5-stilar (search, tagChip, tagFilters) |
| `frontend/src/types/index.ts` | **Uppdaterad** MealPlan/MealPlanDay matchar backend-svar |
| `frontend/src/App.tsx` | `/meal-plans` route aktiverad |

---

## 🔌 API Endpoints

Alla endpoints kräver `Authorization: Bearer <token>`.

```
GET    /api/meal-plans              → { mealPlans: MealPlan[] }           (med days + lightweight recipe)
GET    /api/meal-plans/:id          → { mealPlan: MealPlan }              (full, med recipe-detaljer)
POST   /api/meal-plans              → { mealPlan: MealPlan }              201
PATCH  /api/meal-plans/:id          → { mealPlan: MealPlan }              (namn/datum/byt ut alla days)
DELETE /api/meal-plans/:id          → null                                204
```

### Request body för POST + PATCH /api/meal-plans

```json
{
  "name": "Vecka 24",
  "startDate": "2025-06-09",
  "endDate": "2025-06-15",
  "days": [
    { "dayOfWeek": 0, "mealType": "breakfast", "recipeId": "cuid..." },
    { "dayOfWeek": 0, "mealType": "dinner",    "recipeId": "cuid..." }
  ]
}
```

`dayOfWeek`: 0 = Måndag … 6 = Söndag  
`mealType`: `"breakfast"` | `"lunch"` | `"dinner"` | `"snack"`  
PATCH med `days` ersätter **alla** befintliga dag-slots.

---

## 🔧 Tillgängliga verktyg för Modul 6

- **`useMealPlans()`** — hook: `{ mealPlans, isLoading, error, fetchMealPlans, addMealPlan, editMealPlan, removeMealPlan, clearError }`
- **`mealPlanService`** (frontend) — `getMealPlans`, `getMealPlanById`, `createMealPlan`, `updateMealPlan`, `deleteMealPlan`
- **`mealPlanService`** (backend) — samma, direkt Prisma-access

---

## 📋 Vad Modul 6 kan bygga

**Förslag:**
- **Dashboard-uppdatering** — visa veckans plan direkt på DashboardPage
- **Shopping list** — generera inköpslista baserat på veckans MealPlan
- **Export** — exportera recept eller planer som PDF/text
- **Recipe sharing** — dela recept via länk (publika recept)
- **Notifications / reminders** — "Vad ska du laga idag?"

---

## 📁 Projektstruktur efter M5

```
ai-recipe-generator/
├── backend/src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── ingredientController.ts
│   │   ├── recipeController.ts
│   │   └── mealPlanController.ts   ✓ M5
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── ingredients.ts
│   │   ├── recipes.ts
│   │   └── mealPlans.ts            ✓ M5
│   ├── services/
│   │   ├── authService.ts
│   │   ├── ingredientService.ts
│   │   ├── recipeService.ts
│   │   └── mealPlanService.ts      ✓ M5
│   └── index.ts                    (meal-plans route aktiverad) ✓ M5
└── frontend/src/
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useIngredients.ts
    │   ├── useRecipes.ts
    │   └── useMealPlans.ts         ✓ M5
    ├── pages/
    │   ├── DashboardPage.tsx
    │   ├── RecipesPage.tsx         (M5: sökning + tag-filter) ✓
    │   ├── RecipesPage.module.scss (M5: nya stilar) ✓
    │   ├── MealPlanPage.tsx        ✓ M5
    │   └── MealPlanPage.module.scss ✓ M5
    ├── services/
    │   ├── api.ts
    │   ├── ingredientService.ts
    │   ├── recipeService.ts
    │   └── mealPlanService.ts      ✓ M5
    ├── types/index.ts              (MealPlan/Day uppdaterade) ✓ M5
    └── App.tsx                     (/meal-plans aktiverad) ✓ M5
```
