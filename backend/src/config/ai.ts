/*export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return apiKey;
}

export const RECIPE_MODEL = 'meta-llama/llama-3.1-8b-instruct';*/
export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return apiKey;
}

export const RECIPE_MODEL = 'google/gemini-2.5-flash-lite';
