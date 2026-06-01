import { prisma } from '../config/database';
import { getGeminiApiKey, RECIPE_MODEL } from '../config/ai';
import { createError } from '../utils/createError';

// ── Types ────────────────────────────────────────────────

export interface GenerateRecipeInput {
  ingredients: string[];
  goal?: 'balanced' | 'protein' | 'budget' | 'lowCarb' | 'vegetarian';
  servings?: number;
  cuisine?: string;
  excludeAllergens?: string[];
}

export interface RecipeIngredient {
  name: string;
  amount?: string;
  unit?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface GeneratedRecipe {
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  tags: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ── AI Generation ────────────────────────────────────────

export const generateRecipe = async (
  input: GenerateRecipeInput
): Promise<GeneratedRecipe> => {
  const apiKey = getGeminiApiKey();

  const goalDescriptions: Record<string, string> = {
    balanced:   'välbalanserade makronäringsämnen (lika fokus på protein, kolhydrater och hälsosamma fetter)',
    protein:    'hög proteinhalt lämplig för muskeluppbyggnad',
    budget:     'budgetvänlig och använder billiga ingredienser',
    lowCarb:    'låg kolhydratshalt (under 20g nettokol)',
    vegetarian: 'helt vegetarisk (inget kött eller fisk)',
  };

  const goalNote     = input.goal                    ? `\nOptimeringsmål: ${goalDescriptions[input.goal]}` : '';
  const allergenNote = input.excludeAllergens?.length ? `\nExkludera allergener: ${input.excludeAllergens.join(', ')}` : '';
  const cuisineNote  = input.cuisine                 ? `\nKökstyp: ${input.cuisine}` : '';
  const servingsNote = input.servings                ? `\nAntal portioner: ${input.servings}` : '';

  const prompt = `Du är en expert kock och nutritionist. Skapa ett detaljerat recept med i huvudsak dessa ingredienser:
${input.ingredients.map((i) => `- ${i}`).join('\n')}
${goalNote}${allergenNote}${cuisineNote}${servingsNote}

Du får inkludera några vanliga skafferivaror (salt, peppar, olja, etc.) vid behov, men de listade ingredienserna ska vara stjärnorna.

VIKTIGT: Svara ENBART med ett JSON-objekt — ingen markdown, ingen förklaring, inga backticks. ALL text i JSON-objektet måste vara på svenska, inklusive titeln, beskrivningen, ingredienserna, instruktionerna och taggarna. JSON-objektet måste matcha exakt denna struktur:
{
  "title": "sträng på svenska",
  "description": "sträng på svenska (2-3 meningar som beskriver rätten)",
  "ingredients": [{ "name": "sträng på svenska", "amount": "sträng", "unit": "sträng" }],
  "instructions": ["steg 1 på svenska", "steg 2 på svenska"],
  "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "sugar": number },
  "tags": ["sträng på svenska"],
  "prepTime": number,
  "cookTime": number,
  "servings": number,
  "difficulty": "easy" | "medium" | "hard"
}

Näringsvärden är per portion i gram (förutom kalorier). prepTime och cookTime är i minuter.`;

  let text: string;
  try {
    const response = await fetch(
      `https://openrouter.ai/api/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: RECIPE_MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const status = response.status;
      if (status === 401) throw createError('Ogiltig OpenRouter API-nyckel. Kontrollera GEMINI_API_KEY i .env', 502);
      if (status === 429) throw createError('AI-hastighetsgränsen nådd. Vänta ett ögonblick och försök igen.', 429);
      if (status === 403) throw createError('OpenRouter API-nyckeln saknar behörighet.', 502);
      if (status >= 500) throw createError('AI-tjänsten är tillfälligt otillgänglig. Försök igen snart.', 503);
      throw createError(`AI-förfrågan misslyckades: ${(errBody as { error?: { message?: string } }).error?.message ?? status}`, 502);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    text = data.choices?.[0]?.message?.content ?? '';
    if (!text) throw createError('AI returnerade ett tomt svar. Försök igen.', 502);
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode) throw err;
    throw createError('Kunde inte kontakta AI-tjänsten.', 502);
  }

  let parsed: GeneratedRecipe;
  try {
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    parsed = JSON.parse(clean) as GeneratedRecipe;
  } catch {
    throw createError('AI returnerade ogiltig JSON. Försök igen.', 502);
  }

  if (!parsed.title || !Array.isArray(parsed.ingredients) || !Array.isArray(parsed.instructions)) {
    throw createError('AI-svaret saknar obligatoriska fält. Försök igen.', 502);
  }

  return parsed;
};

// ── Save generated recipe ────────────────────────────────

export const saveRecipe = async (
  userId: string,
  recipe: GeneratedRecipe,
  sourcePrompt?: string
) => {
  return prisma.recipe.create({
    data: {
      userId,
      title:        recipe.title,
      description:  recipe.description,
      ingredients:  recipe.ingredients,
      instructions: recipe.instructions,
      nutrition:    recipe.nutrition ?? undefined,
      tags:         recipe.tags ?? undefined,
      prepTime:     recipe.prepTime,
      cookTime:     recipe.cookTime,
      servings:     recipe.servings,
      difficulty:   recipe.difficulty,
      sourcePrompt,
    },
  });
};

// ── CRUD ─────────────────────────────────────────────────

export const getRecipes = async (userId: string) => {
  return prisma.recipe.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, description: true, tags: true,
      prepTime: true, cookTime: true, servings: true,
      difficulty: true, isFavorite: true, createdAt: true,
      ingredients: false, instructions: false, nutrition: false,
      sourcePrompt: false, userId: false, updatedAt: false,
    },
  });
};

export const getRecipeById = async (id: string, userId: string) => {
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) throw createError('Recept hittades inte', 404);
  if (recipe.userId !== userId) throw createError('Åtkomst nekad', 403);
  return recipe;
};

export const toggleFavorite = async (id: string, userId: string) => {
  const recipe = await getRecipeById(id, userId);
  return prisma.recipe.update({ where: { id }, data: { isFavorite: !recipe.isFavorite } });
};

export const deleteRecipe = async (id: string, userId: string) => {
  await getRecipeById(id, userId);
  await prisma.recipe.delete({ where: { id } });
};
