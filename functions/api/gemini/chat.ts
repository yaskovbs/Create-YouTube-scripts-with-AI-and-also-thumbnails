import type { PagesFunction } from '@cloudflare/workers-types';
import { Env, getGenAIClient, parseGeminiError, jsonResponse } from '../../_shared/gemini';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json().catch(() => ({} as any));
    const { messages, sourceVideos, currentScript, prompt } = body as {
      messages?: any[];
      sourceVideos?: any[];
      currentScript?: any;
      prompt?: string;
    };
    const customApiKey = context.request.headers.get('x-gemini-api-key') || undefined;

    if (!prompt) {
      return jsonResponse({ error: 'חסרה הודעה לצ\'אט' }, 400);
    }

    const ai = getGenAIClient(context.env, customApiKey);

    // Build context background
    let contextStr = '--- סרטוני המקור שהועלו ---\n';
    if (sourceVideos && sourceVideos.length > 0) {
      sourceVideos.forEach((v: any, i: number) => {
        contextStr += `סרטון #${i + 1}: ${v.title}\nתמליל: ${v.transcript.substring(0, 1000)}...\n\n`;
      });
    } else {
      contextStr += 'אין סרטוני מקור עדיין.\n';
    }

    if (currentScript) {
      contextStr += `\n--- התסריט שנוצר כעת ---\nכותרת ראשית: ${currentScript.mainTitle}\n`;
      contextStr += `Hook: ${currentScript.hookText}\n`;
      contextStr += `פרקים (${currentScript.chapters?.length || 0}):\n`;
      currentScript.chapters?.forEach((c: any) => {
        contextStr += `[${c.timestamp}] ${c.title}: ${c.summary}\n`;
      });
    }

    const chatHistory = (messages || []).map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const systemInstruction = `אתה עוזר AI מומחה ליוטיוב ותסריטאי מנוסה הפועל בצמוד למשתמש.
יש לך גישה מלאה אל סרטוני המקור שהמשתמש טען ואל התסריט שנוצר.
תפקידך לעזור למשתמש לשפר את התסריט, לכתוב פרקים חלופיים, ליצור רעיונות נוספים לכותרות, להציע B-Roll, לתרגם, לענות על שאלות או לבצע שינויים ממוקדים לפי בקשתו.
קשר והפניות:
${contextStr}

ענה תמיד בצורה אדיבה, ברורה ומקצועית, רצוי בעברית תקנית ועשירה (אלא אם המשתמש שואל בשפה אחרת).`;

    const chat = ai.chats.create({
      model: 'gemini-3.6-flash',
      history: chatHistory,
      config: {
        systemInstruction,
      }
    });

    const response = await chat.sendMessage({ message: prompt });
    const replyText = response.text || 'סליחה, לא הצלחתי לייצר תגובה.';

    return jsonResponse({ reply: replyText });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return jsonResponse({ error: parseGeminiError(error) }, 500);
  }
};
