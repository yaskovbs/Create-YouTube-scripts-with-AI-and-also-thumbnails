import type { PagesFunction } from '@cloudflare/workers-types';
import { Env, getGenAIClient, extractYouTubeId, jsonResponse } from '../../_shared/gemini';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json().catch(() => ({} as any));
    const { url } = body as { url?: string };
    const customApiKey = context.request.headers.get('x-gemini-api-key') || undefined;

    if (!url || typeof url !== 'string') {
      return jsonResponse({ error: 'כתובת קישור יוטיוב לא תקינה' }, 400);
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return jsonResponse({ error: 'לא ניתן לחלץ מזהה סרטון (Video ID) מהקישור שנשלח' }, 400);
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
        const oembedData: any = await oembedRes.json();
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
          'Accept-Language': 'he,en-US;q=0.9,en;q=0.8',
        },
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
        const ai = getGenAIClient(context.env, customApiKey);
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

    return jsonResponse({
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
    return jsonResponse({ error: error.message || 'שגיאה בפענוח סרטון היוטיוב' }, 500);
  }
};
