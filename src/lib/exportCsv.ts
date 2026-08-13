import { GeneratedResult } from '../types';

/**
 * Escapes a cell value for CSV formatting according to RFC 4180
 */
function escapeCsvValue(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  // Replace double quotes with pair of double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Exports script metrics, keyword analytics, and chapter statistics to a downloadable CSV file.
 * Adds UTF-8 BOM (\uFEFF) so Microsoft Excel opens Hebrew text correctly without encoding issues.
 */
export function exportMetricsToCsv(result: GeneratedResult, wpmRate: number = 140): void {
  const hookWords = result.hookText ? result.hookText.split(/\s+/).filter(Boolean).length : 0;
  const introWords = result.introText ? result.introText.split(/\s+/).filter(Boolean).length : 0;
  const ctaWords = result.ctaText ? result.ctaText.split(/\s+/).filter(Boolean).length : 0;
  const chaptersWords = (result.chapters || []).reduce(
    (acc, c) => acc + (c.scriptText ? c.scriptText.split(/\s+/).filter(Boolean).length : 0),
    0
  );
  const totalWordCount = hookWords + introWords + ctaWords + chaptersWords;

  const totalSeconds = Math.round((totalWordCount / wpmRate) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const estReadingFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // Complexity metrics
  const fullText = `${result.hookText} ${result.introText} ${result.ctaText} ${(result.chapters || []).map((c) => c.scriptText).join(' ')}`;
  const sentences = fullText.split(/[.!?:]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  const avgWordsPerSentence = Math.round((totalWordCount / sentenceCount) * 10) / 10;

  const wordsList = fullText.split(/\s+/).filter((w) => w.length > 0);
  const longWordsCount = wordsList.filter((w) => w.length >= 7).length;
  const longWordsRatio = Math.round((longWordsCount / Math.max(1, totalWordCount)) * 100);

  const uniqueWords = new Set(wordsList.map((w) => w.toLowerCase().replace(/[^\w\u0590-\u05FF]/g, ''))).size;
  const vocabularyDiversity = Math.round((uniqueWords / Math.max(1, totalWordCount)) * 100);

  let complexityScore = Math.min(
    100,
    Math.max(15, Math.round(avgWordsPerSentence * 2.8 + longWordsRatio * 1.5 + vocabularyDiversity * 0.3))
  );

  let complexityCategory = 'סטנדרט יוטיוב קולח ומקצועי';
  if (complexityScore < 45) {
    complexityCategory = 'נגישה ופשוטה להבנה (נוחה לקהל הרחב)';
  } else if (complexityScore > 75) {
    complexityCategory = 'תסריט מעמיק, טכני ומורכב (Deep Dive)';
  }

  // Keywords & SEO tags
  const seoTagsStr = Array.isArray(result.seoTags) ? result.seoTags.join(', ') : '';

  const rows: (string | number)[][] = [];

  // Summary Table Header
  rows.push(['--- מדדי תסריט כלליים (Script Overview Metrics) ---']);
  rows.push(['פרמטר', 'ערך']);
  rows.push(['כותרת התסריט', result.mainTitle]);
  rows.push(['תאריך יצירה', new Date(result.generatedAt).toLocaleString('he-IL')]);
  rows.push(['תאריך יעד לפרסום', result.deadline ? new Date(result.deadline).toLocaleString('he-IL') : 'לא הוגדר']);
  rows.push(['כמות מילים כוללת', totalWordCount]);
  rows.push(['קצב הקראה נבחר (מילים בדקה)', `${wpmRate} WPM`]);
  rows.push(['זמן הקראה/וידאו משוער (דקות:שניות)', estReadingFormatted]);
  rows.push(['ציון מורכבות הטקסט (0-100)', complexityScore]);
  rows.push(['קטגוריית מורכבות', complexityCategory]);
  rows.push(['ממוצע מילים למשפט', avgWordsPerSentence]);
  rows.push(['יחס מילים ארוכות/מורכבות (%)', `${longWordsRatio}%`]);
  rows.push(['גיוון אוצר מילים (%)', `${vocabularyDiversity}%`]);
  rows.push(['מילים ייחודיות', uniqueWords]);
  rows.push(['סה"כ משפטים', sentenceCount]);
  rows.push(['כמות פרקים בסרטון', (result.chapters || []).length]);
  rows.push(['תגיות SEO ומילות מפתח', seoTagsStr]);
  rows.push([]);

  // Section Word Breakdown
  rows.push(['--- התפלגות מילים לפי חלקים ---']);
  rows.push(['חלק בתסריט', 'כמות מילים', 'אחוז מסך התסריט']);
  rows.push(['פתיח ו-Hook', hookWords + introWords, `${Math.round(((hookWords + introWords) / Math.max(1, totalWordCount)) * 100)}%`]);
  rows.push(['פרקים מרכזיים', chaptersWords, `${Math.round((chaptersWords / Math.max(1, totalWordCount)) * 100)}%`]);
  rows.push(['הנעה לפעולה (CTA)', ctaWords, `${Math.round((ctaWords / Math.max(1, totalWordCount)) * 100)}%`]);
  rows.push([]);

  // Detailed Chapter Analytics
  rows.push(['--- ניתוח מפורט לפי פרקים (Chapters Breakdown) ---']);
  rows.push(['מספר פרק', 'כותרת הפרק', 'כמות מילים', 'זמן הקראה משוער (שניות)', 'רמז ויזואלי / Visual Cue']);

  (result.chapters || []).forEach((ch, idx) => {
    const chWords = ch.scriptText ? ch.scriptText.split(/\s+/).filter(Boolean).length : 0;
    const chSecs = Math.round((chWords / wpmRate) * 60);
    const chMins = Math.floor(chSecs / 60);
    const chRemSecs = chSecs % 60;
    const chTimeStr = `${chMins}:${chRemSecs < 10 ? '0' : ''}${chRemSecs}`;

    rows.push([
      idx + 1,
      ch.title || `פרק ${idx + 1}`,
      chWords,
      chTimeStr,
      ch.visualCue || ''
    ]);
  });

  // Convert to CSV String
  const csvContent = rows
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(','))
    .join('\r\n');

  // Add UTF-8 BOM for Excel Hebrew support
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeFilename = (result.mainTitle || 'script_metrics')
    .replace(/[^\u0590-\u05FFa-zA-Z0-9_-]/g, '_')
    .substring(0, 30);
  link.setAttribute('download', `${safeFilename}_metrics.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
