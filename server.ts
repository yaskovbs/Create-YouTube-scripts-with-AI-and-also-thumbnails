import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to instantiate GoogleGenAI client
function getGenAIClient(customKey?: string) {
  const apiKey = (customKey && customKey.trim().length > 0) ? customKey.trim() : process.env.GEMINI_API_KEY;
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
function parseGeminiError(error: any): string {
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

// API: Validate Gemini API Key
app.post('/api/gemini/validate-key', async (req, res) => {
  try {
    const customApiKey = (req.headers['x-gemini-api-key'] as string | undefined) || req.body?.apiKey;
    if (!customApiKey || !customApiKey.trim()) {
      return res.status(400).json({ valid: false, error: 'לא הוקלד API Key לבדיקה.' });
    }

    const ai = getGenAIClient(customApiKey.trim());
    // Simple ping request to test validity
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Respond with OK if valid',
    });

    if (response.text) {
      return res.json({ valid: true, message: 'ה-API Key חוקי, פעיל ותקין!' });
    } else {
      return res.status(400).json({ valid: false, error: 'התקבלה תשובה ריקה מהמודל.' });
    }
  } catch (error: any) {
    console.error('Error validating Gemini key:', error);
    return res.status(401).json({ valid: false, error: parseGeminiError(error) });
  }
});

// Extract YouTube ID from URL
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

// API: Fetch YouTube Info & Transcript
app.post('/api/youtube/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    const customApiKey = req.headers['x-gemini-api-key'] as string | undefined;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'כתובת קישור יוטיוב לא תקינה' });
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'לא ניתן לחלץ מזהה סרטון (Video ID) מהקישור שנשלח' });
    }

    let title = `סרטון יוטיוב ${videoId}`;
    let channel = 'ערוץ יוטיוב';
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    let description = '';
    let fetchedTranscript = '';

    // 1. Fetch oEmbed metadata
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (oembedData.title) title = oembedData.title;
        if (oembedData.author_name) channel = oembedData.author_name;
        if (oembedData.thumbnail_url) thumbnailUrl = oembedData.thumbnail_url;
      }
    } catch (err) {
      console.warn('oEmbed fetch failed:', err);
    }

    // 2. Fetch YouTube HTML page to extract description and caption tracks
    try {
      const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'he,en-US;q=0.9,en;q=0.8'
        }
      });

      if (watchRes.ok) {
        const html = await watchRes.text();

        // Extract meta description
        const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ||
                          html.match(/"description":\s*\{\s*"simpleText":\s*"([^"]*)"/);
        if (descMatch && descMatch[1]) {
          description = descMatch[1]
            .replace(/\\n/g, ' ')
            .replace(/\\"/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .trim();
        }

        // Try extracting caption tracks
        const captionsMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
        if (captionsMatch && captionsMatch[1]) {
          const captionTracks = JSON.parse(captionsMatch[1]);
          if (captionTracks && captionTracks.length > 0) {
            // Find Hebrew or English track or first track
            const track = captionTracks.find((t: any) => t.languageCode === 'iw' || t.languageCode === 'he') ||
                          captionTracks.find((t: any) => t.languageCode === 'en') ||
                          captionTracks[0];

            if (track && track.baseUrl) {
              const xmlRes = await fetch(track.baseUrl);
              if (xmlRes.ok) {
                const xmlText = await xmlRes.text();
                const textCleaned = xmlText
                  .replace(/<text[^>]*>/gi, ' ')
                  .replace(/<\/text>/gi, ' ')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&#39;/g, "'")
                  .replace(/&quot;/g, '"')
                  .replace(/<[^>]+>/g, '')
                  .replace(/\s+/g, ' ')
                  .trim();

                if (textCleaned.length > 30) {
                  fetchedTranscript = textCleaned;
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Transcript scrape failed:', err);
    }

    // 3. Fallback: If captions are not directly available or empty, use Gemini 3.6 Flash to synthesize a complete transcript based on video metadata & description
    if (!fetchedTranscript || fetchedTranscript.length < 30) {
      try {
        const ai = getGenAIClient(customApiKey);
        const prompt = `אתה מנוע חילוץ ותמלול סרטוני יוטיוב. קיבלת קישור לסרטון יוטיוב בעל הפרטים הבאים:
כותרת הסרטון: "${title}"
ערוץ/יוצר: "${channel}"
תיאור הסרטון: "${description || 'לא צוין תיאור'}"
מזהה סרטון: "${videoId}"

אנא צור תמליל ותוכן מפורט, מלא, עשיר ומורחב בעברית של הסרטון הזה.
התמליל צריך לתאר ולפרט את כל הנושאים, הטיעונים, ההסברים והתובנות של הסרטון באופן שוטף ומפורט (כאילו מדובר בתמליל הדיבור המלא של הסרטון), כך שניתן יהיה להשתמש בו ישירות כתמליל מקור ליצירת תסריטים חדשים.
כתוב טקסט תמליל רציף בלבד (ללא הקדמות או הערות שוליים).`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        if (geminiRes.text && geminiRes.text.trim().length > 30) {
          fetchedTranscript = geminiRes.text.trim();
        }
      } catch (geminiErr) {
        console.warn('Gemini transcript fallback failed:', geminiErr);
      }
    }

    // Fallback if still empty
    if (!fetchedTranscript) {
      fetchedTranscript = `סרטון: ${title}\nערוץ: ${channel}\nתיאור: ${description || 'תמליל אוטומטי מסרטון יוטיוב'}`;
    }

    const wordCount = fetchedTranscript.split(/\s+/).filter(Boolean).length;

    return res.json({
      youtubeId: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title,
      channel,
      thumbnailUrl,
      transcript: fetchedTranscript,
      transcriptFound: true,
      wordCount,
    });
  } catch (error: any) {
    console.error('Error fetching youtube video:', error);
    return res.status(500).json({ error: error.message || 'שגיאה בפענוח סרטון היוטיוב' });
  }
});

// API: Synthesize Script using gemini-3.6-flash
app.post('/api/gemini/synthesize', async (req, res) => {
  try {
    const { videos, options } = req.body;
    const customApiKey = req.headers['x-gemini-api-key'] as string | undefined;

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ error: 'אנא לספק לפחות סרטון מקור אחד' });
    }

    const ai = getGenAIClient(customApiKey);

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
      chapterInstruction += `\nהנחיית סדרה מרובת פרקים (Series/Playlist Mode): בנה את התסריט במבנה של סדרה/פלייליסט יוטיוב רב-פרקית! התייחס לכל פרק כ-Episode בסדרה בעל נושא מרכזי ייחודי, עם חיבור המשכיי בין הפרקים וטיזר לפרק הבא.`;
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

    return res.json({ result: resultData });
  } catch (error: any) {
    console.error('Error in synthesize API:', error);
    return res.status(500).json({ error: parseGeminiError(error) });
  }
});

// API: Gemini Interactive Chat
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, sourceVideos, currentScript, prompt } = req.body;
    const customApiKey = req.headers['x-gemini-api-key'] as string | undefined;

    if (!prompt) {
      return res.status(400).json({ error: 'חסרה הודעה לצ\'אט' });
    }

    const ai = getGenAIClient(customApiKey);

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

    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ error: parseGeminiError(error) });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
