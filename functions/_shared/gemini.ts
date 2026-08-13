import { GoogleGenAI } from '@google/genai';

export interface Env {
  GEMINI_API_KEY: string;
}

// Helper to instantiate GoogleGenAI client
export function getGenAIClient(env: Env, customKey?: string) {
  const apiKey = (customKey && customKey.trim().length > 0) ? customKey.trim() : env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('חסר GEMINI_API_KEY. אנא הכנס API Key בהגדרות האפליקציה.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to format Gemini API errors clearly
export function parseGeminiError(error: any): string {
  const message = error?.message || String(error);
  if (
    message.includes('API_KEY_INVALID') ||
    message.includes('API key not valid') ||
    (message.includes('INVALID_ARGUMENT') && message.includes('key')) ||
    message.includes('UNAUTHENTICATED') ||
    message.includes('PERMISSION_DENIED') ||
    message.includes('401') ||
    message.includes('403')
  ) {
    return 'ה-API Key אינו חוקי, פג תוקף, או שאין לו הרשאה עבור gemini-3.6-flash. אנא אמת את המפתח בהגדרות.';
  }
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
    return 'חרגת ממכסת הבקשות של המפתח (Quota Limit Exceeded). אנא המתן מספר רגעים או החלף מפתח בהגדרות.';
  }
  return message;
}

// Extract YouTube ID from URL
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
