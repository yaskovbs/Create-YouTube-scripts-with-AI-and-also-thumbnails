import type { PagesFunction } from '@cloudflare/workers-types';
import { Env, getGenAIClient, parseGeminiError, jsonResponse } from '../../_shared/gemini';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json().catch(() => ({} as any));
    const customApiKey = context.request.headers.get('x-gemini-api-key') || (body as any)?.apiKey;

    if (!customApiKey || !String(customApiKey).trim()) {
      return jsonResponse({ valid: false, error: 'לא הוקלד API Key לבדיקה.' }, 400);
    }

    const ai = getGenAIClient(context.env, String(customApiKey).trim());
    // Simple ping request to test validity
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Respond with OK if valid',
    });

    if (response.text) {
      return jsonResponse({ valid: true, message: 'ה-API Key חוקי, פעיל ותקין!' });
    } else {
      return jsonResponse({ valid: false, error: 'התקבלה תשובה ריקה מהמודל.' }, 400);
    }
  } catch (error: any) {
    console.error('Error validating Gemini key:', error);
    return jsonResponse({ valid: false, error: parseGeminiError(error) }, 401);
  }
};
