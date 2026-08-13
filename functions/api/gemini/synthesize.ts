import type { PagesFunction } from '@cloudflare/workers-types';
import { Type } from '@google/genai';
import { Env, getGenAIClient, parseGeminiError, jsonResponse } from '../../_shared/gemini';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json().catch(() => ({} as any));
    const { videos, options } = body as { videos?: any[]; options?: any };
    const customApiKey = context.request.headers.get('x-gemini-api-key') || undefined;

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return jsonResponse({ error: 'אנא לספק לפחות סרטון מקור אחד' }, 400);
    }

    const ai = getGenAIClient(context.env, customApiKey);

    const targetLang = options.language || 'Hebrew';
    const duration = options.targetDuration || 'standard';
    const tone = options.tone || 'engaging';
    const audience = options.targetAudience || 'חובבי יוטיוב ויוצרי תוכן';
    const special = options.specialInstructions || '';

    let durationDesc = 'סרטון יוטיוב באורך רגיל (8-12 דקות, כ-1,200 עד 1,800 מילים)';
    if (options.customTargetMinutes || options.customTargetWords) {
      const minsStr = options.customTargetMinutes ? `${options.customTargetMinutes} דקות` : '';
      const wordsStr = options.customTargetWords ? `${options.customTargetWords} מילים` : '';
      durationDesc = `הנחיה מדויקת מהיוצר: אורך התסריט חייב להיות בדיוק כ-${[minsStr, wordsStr].filter(Boolean).join(' / ')} במדויק! פצל והרחב את הפרקים בהתאם לכמות מילים וזמן מבוקשים אלו.`;
    } else {
      if (duration === 'shorts') durationDesc = 'סרטון YouTube Short קצר וקצבי (עד 60 שניות, כ-150-200 מילים)';
      if (duration === 'short') durationDesc = 'סרטון קצר וממוקד (3-5 דקות, כ-500-800 מילים)';
      if (duration === 'deep') durationDesc = 'סרטון מעמיק ומפורט (15-20 דקות, כ-2,500-3,500 מילים)';
    }

    let toneDesc = 'מרתק, סוחף ולימודי';
    if (tone === 'educational') toneDesc = 'לימודי, ברור, מובנה ומסביר פנים';
    if (tone === 'storytelling') toneDesc = 'סיפורי (Storytelling), דרמטי ומסקרן';
    if (tone === 'humorous') toneDesc = 'הומוריסטי, קליל, שנוי במחלוקת במקצת ומצחיק';
    if (tone === 'analytical') toneDesc = 'אנליטי, מבוסס עובדות ונתונים, מקצועי';
    if (tone === 'professional') toneDesc = 'מקצועי, רשמי ומדויק';

    const sourceContentPrompt = videos.map((v, i) => `
--- סרטון מקור #${i + 1}: "${v.title}" (${v.channel || 'ערוץ ne'}) ---
תמליל/תוכן:
${v.transcript}
`).join('\n\n');

    let chapterInstruction = 'חלוקת הפרקים תבוצע בצורה הגיונית ואוטומטית לפי נושאי המקור.';
    if (options.chapterControlMode === 'exact_count' && options.chapterCount) {
      chapterInstruction = `הנחיה קשיחה: חובה לחלק את הסרטון והתסריט בדיוק ל-${options.chapterCount} פרקים! לכל פרק יש לתת כותרת מתאימה, תמצית, טקסט תסריט מלא וטיים-סטאמפ.`;
    } else if (options.chapterControlMode === 'chapter_length' && options.chapterLengthRange) {
      let lenDesc = '2-3 דקות לכל פרק';
      if (options.chapterLengthRange === 'medium_3_5') lenDesc = '3-5 דקות לכל פרק';
      if (options.chapterLengthRange === 'long_6_10') lenDesc = '6-10 דקות לכל פרק (מעמיק)';
      chapterInstruction = `הנחיה קשיחה: אורך כל פרק בתסריט צריך להיות כ-${lenDesc}. התאם את מספר הפרקים ואת פירוט התסריט בהתאם לאורך מבוקש זה!`;
    }

    if (options.seriesMode) {
      const seasonNum = options.seasonNumber || 1;
      const epCount = options.seasonEpisodeCount || options.chapterCount || 6;
      const epTitlesDesc = options.existingEpisodeTitles
        ? `\nשמות/נושאי הפרקים הקיימים בעונה זו שחובה להיצמד אליהם: ${options.existingEpisodeTitles}`
        : '';

      chapterInstruction = `הנחיה קשיחה ומחייבת לסדרה/עונה (Season ${seasonNum}):
החלוקה חייבת להתבצע בדיוק לפי ${epCount} הפרקים הקיימים בעונה ${seasonNum}!
חובה ליצור בדיוק ${epCount} פרקים (Chapters/Episodes), כאשר כל פרק בתסריט מייצג פרק (Episode) בפועל בעונה זו.
אל תמציא כמות פרקים שרירותית - היצמד במדויק ל-${epCount} הפרקים הקיימים בעונה!${epTitlesDesc}
בנה את התסריט במבנה של עונה רב-פרקית עם חיבור המשכיי בין פרק לפרק וטיזר מותח לפרק הבא.`;
    }

    const systemInstruction = `אתה קריאייטיב דירקטור ויוצר תסריטי יוטיוב (YouTube Scriptwriter & Content Strategist) מהשורה הראשונה בעולם.
תפקידך לקחת את התכנים, התמלילים והרעיונות מכמה סרטוני יוטיוב נפרדים, לשלב את התובנות הטובות ביותר שלהם, ולכתוב תסריט מאוחד, מקורי לחלוטין, סוחף ומבנה ברמה הכי גבוהה עבור סרטון יוטיוב חדש אחד!

כללי זהב לכתיבת התסריט:
1. שפה: כתוב את כל התסריט והכותרות בשפה: ${targetLang} (אלא אם התקבל הנחיה אחרת).
2. אורך מבוקש: ${durationDesc}.
3. טון וסגנון: ${toneDesc}.
4. קהל יעד: ${audience}.
5. הנחיות מיוחדות מהיוצר: ${special || 'ללא'}.
6. הנחיות חלוקת פרקים (Chapter Division): ${chapterInstruction}
7. התסריט חייב לכלול:
   - Hook מרתק ב-10 השניות הראשונות שתופס את הצופה.
   - הפתיח (Intro) שמבטיח ערך.
   - חלוקה ברורה לפרקים (Chapters) עם טיים-סטאמפס משוערים (00:00, 01:30...), כותרת פרק, תמצית, טקסט התסריט המלא של הפרק, והנחיות ויזואליות B-Roll / Visual Cues בסוגריים מרובעות [כמו: צילום תקריב, גרף על המסך, מעבר מהיר].
   - הנעה לפעולה עוצמתית (CTA) וסיום משכנע.
   - 5-8 הצעות לכותרות ויראליות עם הזווית השיווקית וקונספט לתמונת ממוזערת (Thumbnail concept).
   - תיאור מוכן להעתקה ליוטיוב כולל טיים-סטאמפס והאשטגים.
   - ניתוח 10-15 מילות מפתח מומלצות לקידום ה-SEO ביוטיוב (seoTags) עם רמת רלוונטיות וקטגוריה.
   - ניתוח טון רגשי ודינמיקה לכל פרק (emotionalCurve) בטווח 0-100 (כאשר 100=שיא מתח/רגש, 50=הסבר מאוזן) עם הגדרת תווית רגש והנחיית קצב.

עליך להחזיר תגובת JSON מבוקרת במבנה המדויק שהוגדר ב-schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `אנא צור תסריט יוטיוב מאוחד ומקצועי המבוסס על סרטוני המקור הבאים:\n\n${sourceContentPrompt}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainTitle: { type: Type.STRING, description: 'הכותרת הראשית המומלצת לסרטון' },
            titles: {
              type: Type.ARRAY,
              description: 'רשימת הצעות לכותרות ויראליות',
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  hookAngle: { type: Type.STRING, description: 'למה הכותרת עובדת / הזווית הפסיכולוגית' },
                  thumbnailConcept: { type: Type.STRING, description: 'רעיון לוויזואל של התמונת ממוזערת' }
                },
                required: ['title', 'hookAngle', 'thumbnailConcept']
              }
            },
            hookText: { type: Type.STRING, description: 'פתיח ה-Hook החזק ל-10 השניות הראשונות' },
            introText: { type: Type.STRING, description: 'הקדמה והצגת הנושא' },
            chapters: {
              type: Type.ARRAY,
              description: 'חלוקת הסרטון לפרקים עם טיים-סטאמפ',
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING, description: 'לדוגמה 00:00, 01:25' },
                  title: { type: Type.STRING, description: 'שם הפרק' },
                  summary: { type: Type.STRING, description: 'תמצית רעיון הפרק' },
                  scriptText: { type: Type.STRING, description: 'התסריט המלא והדיבור של היוצר בפרק זה' },
                  visualCue: { type: Type.STRING, description: 'הנחיות B-Roll, צילום, ואפקטים ויזואליים' },
                  speakerNote: { type: Type.STRING, description: 'דגשי טון, אינטונציה או שפת גוף' }
                },
                required: ['timestamp', 'title', 'summary', 'scriptText', 'visualCue']
              }
            },
            ctaText: { type: Type.STRING, description: 'סיום והנעה לפעולה (Call To Action)' },
            youtubeDescription: { type: Type.STRING, description: 'טקסט תיאור מלא מוכן להעתקה ליוטיוב כולל סקירת הפרקים' },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'האשטגים מומלצים ליוטיוב'
            },
            seoTags: {
              type: Type.ARRAY,
              description: 'מילות מפתח מומלצות לקידום ביוטיוב SEO',
              items: {
                type: Type.OBJECT,
                properties: {
                  tag: { type: Type.STRING },
                  category: { type: Type.STRING, description: 'High Volume | Long-tail | Trending' },
                  relevanceScore: { type: Type.NUMBER, description: '1-100' }
                },
                required: ['tag']
              }
            },
            emotionalCurve: {
              type: Type.ARRAY,
              description: 'עקומת הדינמיקה הרגשית לכל פרק',
              items: {
                type: Type.OBJECT,
                properties: {
                  chapterIndex: { type: Type.NUMBER },
                  chapterTitle: { type: Type.STRING },
                  emotionalScore: { type: Type.NUMBER, description: '0-100' },
                  emotionLabel: { type: Type.STRING, description: 'למשל: פתיחה דרמטית, הסבר מעמיק, שיא רגשי' },
                  pacingNote: { type: Type.STRING, description: 'הנחיית קצב דיבור' }
                },
                required: ['chapterIndex', 'chapterTitle', 'emotionalScore', 'emotionLabel', 'pacingNote']
              }
            },
            fullScriptMarkdown: { type: Type.STRING, description: 'כל התסריט המלא בפורמט Markdown קריא' }
          },
          required: ['mainTitle', 'titles', 'hookText', 'introText', 'chapters', 'ctaText', 'youtubeDescription', 'hashtags', 'fullScriptMarkdown']
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('המודל לא החזיר תוכן. אנא נסה שוב.');
    }

    const resultData = JSON.parse(responseText);
    resultData.generatedAt = new Date().toISOString();
    if (options?.deadline) {
      resultData.deadline = options.deadline;
    }

    return jsonResponse({ result: resultData });
  } catch (error: any) {
    console.error('Error in synthesize API:', error);
    return jsonResponse({ error: parseGeminiError(error) }, 500);
  }
};
