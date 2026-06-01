# AI Recipe Generator — Handoff Pack Modul 4

## ✅ Status efter Modul 3

Modul 1 (projektsetup) ✓  
Modul 2 (Auth System) ✓  
**Modul 3 (Ingredients CRUD) ✓** ← just nu klar  

---

## 🏗 Vad Modul 3 byggde

### Backend

| Fil | Vad den gör |
|-----|-------------|
| `backend/prisma/schema.prisma` | `Ingredient`-modell tillagd + `User.ingredients` relation |
| `backend/src/services/ingredientService.ts` | All DB-logik: getIngredients, getIngredientById, createIngredient, updateIngredient, deleteIngredient, clearIngredients |
| `backend/src/controllers/ingredientController.ts` | Zod-validering + delegation till service (getAll, getOne, create, update, remove, clearAll) |
| `backend/src/routes/ingredients.ts` | REST-rutter med `authenticate` middleware på alla |
| `backend/src/index.ts` | `app.use('/api/ingredients', ingredientRoutes)` aktiverad |

### Frontend

| Fil | Vad den gör |
|-----|-------------|
| `frontend/src/types/index.ts` | `UserIngredient`, `CreateIngredientPayload`, `UpdateIngredientPayload` tillagda |
| `frontend/src/services/ingredientService.ts` | API-service: getIngredients, createIngredient, updateIngredient, deleteIngredient, clearIngredients |
| `frontend/src/hooks/useIngredients.ts` | React-hook med full CRUD-state + optimistisk delete |
| `frontend/src/pages/DashboardPage.tsx` | Dashboard med IngredientManager (add, inline edit, delete, clear all) |
| `frontend/src/pages/DashboardPage.module.scss` | SCSS-modul, följer projektets design-tokens |
| `frontend/src/App.tsx` | `/dashboard` route aktiverad |

---

## 🔌 API Endpoints

Alla endpoints kräver `Authorization: Bearer <token>`.

```
GET    /api/ingredients          → { ingredients: UserIngredient[] }
POST   /api/ingredients          → { ingredient: UserIngredient }      201
GET    /api/ingredients/:id      → { ingredient: UserIngredient }
PATCH  /api/ingredients/:id      → { ingredient: UserIngredient }
DELETE /api/ingredients/:id      → null                                204
DELETE /api/ingredients          → { deleted: number }
```

### Request body för POST / PATCH

```json
{
  "name": "Tomatoes",      // required (POST), optional (PATCH)
  "amount": "500",         // optional
  "unit": "g"              // optional
}
```

---

## 🗄 Prisma-schema tillägg

```prisma
model Ingredient {
  id        String   @id @default(cuid())
  userId    String
  name      String
  amount    String?
  unit      String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("ingredients")
}
```

Migration att köra:
```bash
cd backend
npx prisma migrate dev --name add-ingredients
```

---

## 🔧 Tillgängliga verktyg för Modul 4

Exakt samma verktyg som tidigare, plus:

- **`useIngredients()`** — hook som returnerar `{ ingredients, isLoading, error, addIngredient, editIngredient, removeIngredient, clearAll }`. Kan importeras i recipe-flödet för att visa användarens pantry.
- **`ingredientService`** (backend) — kan importeras i `recipeService` för att hämta en användares ingredienser som underlag för AI-generering.
- **`UserIngredient`** typ — `{ id, userId, name, amount?, unit?, createdAt }`.

---

## 📋 Vad Modul 4 ska bygga

**Recipe AI Generation** — användaren väljer ingredienser från sin pantry (eller skriver fritt) och Claude API genererar ett recept.

### Föreslaget scope

#### Backend
1. `recipeService.ts` — CRUD för sparade recept + AI-generering via Anthropic SDK (`config/ai.ts` finns redan)
2. `recipeController.ts` — endpoints för generate, save, list, get, update (favorite), delete
3. `routes/recipes.ts`
4. Aktivera `app.use('/api/recipes', recipeRoutes)` i `index.ts`

#### Frontend
1. `useRecipes.ts` hook
2. `recipeService.ts` (frontend)
3. `RecipesPage.tsx` — aktivera kommenterad route i `App.tsx`
4. Typer finns redan: `Recipe`, `RecipeGenerationRequest`, `OptimizationGoal`, `NutritionInfo`

### AI-konfiguration
`backend/src/config/ai.ts` är redan scaffoldad. Anthropic SDK är sannolikt inte installerat än — lägg till:
```bash
cd backend && npm install @anthropic-ai/sdk
```
Miljövariabel: `ANTHROPIC_API_KEY` (finns i `.env.example`)

### Prisma: Recipe-modellen finns redan i schemat
Ingen migration behövs för Recipe — modellen definierades redan i M1.

### Pattern att följa
Samma service → controller → route → app.use-pattern som M3.

### Frontends placeholders
I `App.tsx`:
```tsx
// import RecipesPage from './pages/RecipesPage';  // M5
// <Route path="/recipes" element={<RecipesPage />} />
```
RecipesPage aktiveras i M5, men grundläggande recipe-hooks/service byggs i M4.

---

## 🌐 Köra projektet lokalt

```bash
# Backend
cd backend
cp ../../.env.example .env   # fyll i DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate dev --name add-ingredients
npm run dev                  # port 3001

# Frontend
cd frontend
npm install
npm run dev                  # port 5173
```

---

## 📁 Projektstruktur efter M3

```
ai-recipe-generator/
├── backend/
│   ├── prisma/schema.prisma          (Ingredient-modell tillagd)
│   └── src/
│       ├── config/
│       │   ├── database.ts           (prisma singleton)
│       │   └── ai.ts                 (Anthropic config — M4)
│       ├── controllers/
│       │   ├── authController.ts     (M2)
│       │   └── ingredientController.ts (M3) ✓
│       ├── middleware/
│       │   ├── authenticate.ts       (M2)
│       │   ├── errorHandler.ts
│       │   └── notFound.ts
│       ├── routes/
│       │   ├── auth.ts               (M2)
│       │   └── ingredients.ts        (M3) ✓
│       ├── services/
│       │   ├── authService.ts        (M2)
│       │   └── ingredientService.ts  (M3) ✓
│       ├── utils/
│       │   ├── apiResponse.ts        (sendSuccess, sendError)
│       │   └── createError.ts
│       └── index.ts                  (M3 route registrerad) ✓
└── frontend/
    └── src/
        ├── hooks/
        │   ├── useAuth.ts            (M2)
        │   └── useIngredients.ts     (M3) ✓
        ├── pages/
        │   ├── DashboardPage.tsx     (M3) ✓
        │   └── DashboardPage.module.scss (M3) ✓
        ├── services/
        │   ├── api.ts                (axios instance, M2)
        │   └── ingredientService.ts  (M3) ✓
        ├── store/authStore.ts        (M2)
        ├── types/index.ts            (UserIngredient tillagd, M3) ✓
        └── App.tsx                   (/dashboard aktiverad, M3) ✓
```
