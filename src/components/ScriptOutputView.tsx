import React, { useState, useEffect } from 'react';
import { GeneratedResult, SeoTag, EmotionalPoint, ScriptVersion } from '../types';
import {
  Sparkles,
  Layers,
  FileText,
  LayoutGrid,
  Copy,
  Check,
  Download,
  Video,
  Play,
  MessageSquarePlus,
  Clock,
  PieChart as PieChartIcon,
  Printer,
  Trash2,
  Bookmark,
  FileSpreadsheet,
  Search,
  X,
  Maximize2,
  Tag,
  Activity,
  Share2,
  ExternalLink,
  History,
  Plus,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { FocusReadingModal } from './FocusReadingModal';
import { createGoogleDocFromScript } from '../lib/googleDocsExport';
import { ThumbnailPreviewCard } from './ThumbnailPreviewCard';
import { VisualScriptEditor } from './VisualScriptEditor';
import { ScriptMetricsDashboard } from './ScriptMetricsDashboard';
import { ScriptDeadlineBanner } from './ScriptDeadlineBanner';
import { ChapterSegment } from '../types';

interface ScriptOutputViewProps {
  result: GeneratedResult;
  onOpenChatWithPrompt?: (promptText: string) => void;
  onClearSavedScript?: () => void;
  onSelectVersion?: (result: GeneratedResult) => void;
}

const PIE_COLORS = [
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
];

export const ScriptOutputView: React.FC<ScriptOutputViewProps> = ({
  result,
  onOpenChatWithPrompt,
  onClearSavedScript,
  onSelectVersion,
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'visual_editor' | 'full' | 'titles' | 'seo' | 'analytics'>('chapters');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number>(0);

  // Auto-Save Mechanism (Persists to localStorage every 30 seconds)
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        localStorage.setItem('yt_script_last_result', JSON.stringify(result));
        setLastAutoSavedAt(new Date());
      } catch (err) {
        console.warn('Auto-save interval error:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [result]);

  const handleUpdateChapters = (newChapters: ChapterSegment[]) => {
    const updated = {
      ...result,
      chapters: newChapters,
    };
    if (onSelectVersion) {
      onSelectVersion(updated);
    }
    try {
      localStorage.setItem('yt_script_last_result', JSON.stringify(updated));
      setLastAutoSavedAt(new Date());
    } catch (err) {
      console.warn('Manual save error:', err);
    }
  };

  const handleUpdateDeadline = (newDeadline: string | undefined) => {
    const updated = {
      ...result,
      deadline: newDeadline,
    };
    if (onSelectVersion) {
      onSelectVersion(updated);
    }
    try {
      localStorage.setItem('yt_script_last_result', JSON.stringify(updated));
      setLastAutoSavedAt(new Date());
    } catch (err) {
      console.warn('Manual save deadline error:', err);
    }
  };

  // Google Docs Export State
  const [isExportingGDocs, setIsExportingGDocs] = useState(false);
  const [gdocsUrl, setGdocsUrl] = useState<string | null>(null);
  const [gdocsIsCopied, setGdocsIsCopied] = useState<boolean>(false);
  const [gdocsError, setGdocsError] = useState<string | null>(null);

  // Versions Management State
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>('current');

  // Load versions from localStorage
  useEffect(() => {
    try {
      const savedVersions = localStorage.getItem('yt_script_versions_history');
      if (savedVersions) {
        setVersions(JSON.parse(savedVersions));
      }
    } catch (err) {
      console.warn('Failed to load version history:', err);
    }
  }, []);

  // Save new version
  const handleSaveVersion = () => {
    const vName = prompt('הזן שם עבור הגרסה החדשה:', `גרסה ${versions.length + 1} - ${result.mainTitle.substring(0, 25)}`);
    if (!vName) return;

    const newVersion: ScriptVersion = {
      id: Date.now().toString(),
      versionName: vName,
      createdAt: new Date().toISOString(),
      result: { ...result },
      optionsSummary: `${result.chapters.length} פרקים | ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`,
    };

    const updated = [newVersion, ...versions];
    setVersions(updated);
    setActiveVersionId(newVersion.id);
    localStorage.setItem('yt_script_versions_history', JSON.stringify(updated));
  };

  // Delete version
  const handleDeleteVersion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('האם לחוק גרסה זו מההיסטוריה?')) {
      const updated = versions.filter((v) => v.id !== id);
      setVersions(updated);
      localStorage.setItem('yt_script_versions_history', JSON.stringify(updated));
      if (activeVersionId === id) {
        setActiveVersionId('current');
      }
    }
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Export to Google Docs
  const handleExportGDocs = async () => {
    setIsExportingGDocs(true);
    setGdocsError(null);
    setGdocsUrl(null);
    setGdocsIsCopied(false);

    try {
      const res = await createGoogleDocFromScript(result);
      setGdocsUrl(res.docUrl);
      if (res.copiedToClipboard) {
        setGdocsIsCopied(true);
      }
    } catch (err: any) {
      console.error('Google Docs export failed:', err);
      setGdocsError(err.message || 'שגיאה בייצוא ל-Google Docs');
    } finally {
      setIsExportingGDocs(false);
    }
  };

  // Word count & Reading Time calculations
  const hookWords = result.hookText ? result.hookText.split(/\s+/).filter(Boolean).length : 0;
  const introWords = result.introText ? result.introText.split(/\s+/).filter(Boolean).length : 0;
  const ctaWords = result.ctaText ? result.ctaText.split(/\s+/).filter(Boolean).length : 0;
  const chaptersWords = (result.chapters || []).reduce(
    (acc, c) => acc + (c.scriptText ? c.scriptText.split(/\s+/).filter(Boolean).length : 0),
    0
  );

  const totalWordCount = hookWords + introWords + ctaWords + chaptersWords;
  
  // Speech speed ~140 words per minute
  const totalSeconds = Math.round((totalWordCount / 140) * 60);
  const estMinutes = Math.floor(totalSeconds / 60);
  const estRemainingSeconds = totalSeconds % 60;
  const estReadingTimeFormatted =
    estMinutes > 0
      ? `${estMinutes} דקות${estRemainingSeconds > 0 ? ` ו-${estRemainingSeconds} שניות` : ''}`
      : `${estRemainingSeconds} שניות`;

  // Pie chart data for chapter length distribution
  const pieData = (result.chapters || []).map((ch, idx) => {
    const w = ch.scriptText ? ch.scriptText.split(/\s+/).filter(Boolean).length : 0;
    return {
      name: `פרק ${idx + 1}: ${ch.title.substring(0, 20)}${ch.title.length > 20 ? '...' : ''}`,
      fullTitle: ch.title,
      words: w,
      timestamp: ch.timestamp,
    };
  });

  // Emotional curve chart data (with fallback if absent)
  const emotionalData: EmotionalPoint[] = (result.emotionalCurve && result.emotionalCurve.length > 0)
    ? result.emotionalCurve
    : (result.chapters || []).map((ch, idx, arr) => {
        let score = 70;
        let label = 'הסבר מעמיק';
        let pacing = 'קצב בינוני שקול';

        if (idx === 0) {
          score = 88;
          label = 'פתיח מסקרן / מתח גבוה';
          pacing = 'קצב מהיר ונמרץ';
        } else if (idx === arr.length - 1) {
          score = 82;
          label = 'הנעה לפעולה וסיכום עוצמתי';
          pacing = 'קצב ברור וסמכותי';
        } else if (idx === Math.floor(arr.length / 2)) {
          score = 95;
          label = 'שיא רגשי / התגלות מרכזית';
          pacing = 'קצב דרמטי ומלא אנרגיה';
        } else if (idx % 2 === 1) {
          score = 65;
          label = 'ערך פרקטי / נתונים ותובנות';
          pacing = 'קצב יציב וממוקד';
        } else {
          score = 78;
          label = 'העמקה ודוגמאות';
          pacing = 'קצב קצבי וקולח';
        }

        return {
          chapterIndex: idx + 1,
          chapterTitle: ch.title,
          emotionalScore: score,
          emotionLabel: label,
          pacingNote: pacing,
        };
      });

  // Derived SEO Tags (with fallback if absent)
  const seoTagsList: SeoTag[] = (result.seoTags && result.seoTags.length > 0)
    ? result.seoTags.map((t) =>
        typeof t === 'string'
          ? { tag: t, category: 'High Volume' as const, relevanceScore: 85 }
          : t
      )
    : [
        { tag: result.mainTitle, category: 'Brand' as const, relevanceScore: 98 },
        ...(result.hashtags || []).map((h) => ({
          tag: h.replace(/^#/, ''),
          category: 'Trending' as const,
          relevanceScore: 90,
        })),
        ...(result.chapters || []).map((c) => ({
          tag: c.title,
          category: 'Long-tail' as const,
          relevanceScore: 82,
        })),
        { tag: 'תסריט יוטיוב', category: 'High Volume' as const, relevanceScore: 85 },
        { tag: 'טיפים ליוטיוב', category: 'High Volume' as const, relevanceScore: 80 },
      ].slice(0, 15);

  const formattedAllSeoTagsString = seoTagsList.map((st) => st.tag).join(', ');

  // Build complete script text for copy / export
  const buildFullScriptText = () => {
    let script = `====================================================\n`;
    script += `תסריט יוטיוב מאוחד: ${result.mainTitle}\n`;
    script += `נוצר ב: ${new Date(result.generatedAt).toLocaleString('he-IL')}\n`;
    script += `מילים: כ-${totalWordCount} | זמן הקראה משוער: ${estReadingTimeFormatted}\n`;
    script += `====================================================\n\n`;

    script += `[HOOK - 10 שניות ראשונות]\n${result.hookText}\n\n`;
    script += `[INTRO - הקדמה]\n${result.introText}\n\n`;

    script += `====================================================\n`;
    script += `פרקי הסרטון (${result.chapters.length})\n`;
    script += `====================================================\n\n`;

    result.chapters.forEach((c, i) => {
      script += `פרק ${i + 1} [${c.timestamp}] - ${c.title}\n`;
      script += `תמצית: ${c.summary}\n`;
      script += `טקסט התסריט להקראה:\n${c.scriptText}\n`;
      if (c.visualCue) script += `[B-Roll / הנחיה ויזואלית: ${c.visualCue}]\n`;
      script += `----------------------------------------------------\n\n`;
    });

    script += `[CALL TO ACTION - סיום והנעה לפעולה]\n${result.ctaText}\n\n`;

    script += `====================================================\n`;
    script += `תיאור מוכן להעתקה ל-YOUTUBE\n`;
    script += `====================================================\n`;
    script += `${result.youtubeDescription}\n\n`;

    if (result.hashtags && result.hashtags.length > 0) {
      script += `האשטגים: ${result.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}\n\n`;
    }

    if (seoTagsList.length > 0) {
      script += `תגיות SEO מומלצות: ${formattedAllSeoTagsString}\n`;
    }

    return script;
  };

  // Search match count calculation
  const searchLower = searchQuery.trim().toLowerCase();
  let searchMatchCount = 0;
  if (searchLower) {
    const fullContent = buildFullScriptText().toLowerCase();
    const regex = new RegExp(searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = fullContent.match(regex);
    searchMatchCount = matches ? matches.length : 0;
  }

  // Highlight helper
  const highlightText = (text: string) => {
    if (!searchLower) return text;
    const parts = text.split(
      new RegExp(`(${searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    );
    return parts.map((part, i) =>
      part.toLowerCase() === searchLower ? (
        <mark
          key={i}
          className="bg-amber-400 text-slate-950 font-black px-1 py-0.5 rounded shadow"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Download as TXT
  const handleDownloadTxt = () => {
    const text = buildFullScriptText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.mainTitle.replace(/[^\w\u0590-\u05FF]/g, '_')}_תסריט.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download as Markdown
  const handleDownloadMd = () => {
    let md = `# ${result.mainTitle}\n\n`;
    md += `> **זמן הקראה משוער:** ${estReadingTimeFormatted} | **סה"כ מילים:** ${totalWordCount} מילים\n\n`;
    md += `## ⚡ Hook (10 שניות)\n${result.hookText}\n\n`;
    md += `## 🎬 הקדמה (Intro)\n${result.introText}\n\n`;
    md += `## 📚 פרקי הסרטון\n\n`;

    result.chapters.forEach((c, i) => {
      md += `### [${c.timestamp}] פרק ${i + 1}: ${c.title}\n`;
      md += `*תמצית:* ${c.summary}\n\n`;
      md += `${c.scriptText}\n\n`;
      if (c.visualCue) md += `> 🎥 **הנחיה ויזואלית:** ${c.visualCue}\n\n`;
    });

    md += `## 📣 הנעה לפעולה (CTA)\n${result.ctaText}\n\n`;
    md += `---\n\n## 📝 תיאור מוכן ליוטיוב\n\`\`\`\n${result.youtubeDescription}\n\`\`\`\n\n`;
    md += `## 🏷️ תגיות SEO\n${formattedAllSeoTagsString}\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.mainTitle.replace(/[^\w\u0590-\u05FF]/g, '_')}_תסריט.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // PDF Export Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfHeaderTitle, setPdfHeaderTitle] = useState('');
  const [pdfWatermarkText, setPdfWatermarkText] = useState('');

  // Print / PDF Export Functionality
  const handlePrintPdf = (customTitle?: string, customWatermark?: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('נחסם חלון קופץ. אנא אפשר חלונות קופצים בדפדפן כדי לייצא PDF.');
      return;
    }

    const activeVersionObj = versions.find((v) => v.id === activeVersionId);
    const finalHeaderTitle = customTitle || pdfHeaderTitle || result.mainTitle;
    const finalWatermark = customWatermark || pdfWatermarkText || (activeVersionObj ? activeVersionObj.versionName : `גרסה ${versions.length + 1}`);

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="utf-8">
        <title>${result.mainTitle} - תסריט יוטיוב PDF</title>
        <style>
          @page {
            margin: 15mm;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 20px;
            color: #0f172a;
            line-height: 1.6;
            position: relative;
          }

          /* Customizable Header */
          .pdf-header {
            border-bottom: 2.5px solid #dc2626;
            padding-bottom: 10px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .pdf-header-title {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
          }
          .pdf-header-subtitle {
            font-size: 12px;
            color: #dc2626;
            font-weight: 700;
            margin-top: 2px;
          }
          .pdf-header-meta {
            font-size: 11px;
            color: #64748b;
            text-align: left;
            font-family: monospace;
          }

          /* Script Version Watermark Overlay */
          .pdf-watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 70px;
            font-weight: 900;
            color: rgba(220, 38, 38, 0.08);
            pointer-events: none;
            z-index: 99999;
            white-space: nowrap;
            text-transform: uppercase;
            letter-spacing: 5px;
            font-family: system-ui, sans-serif;
            user-select: none;
          }

          h1 { color: #dc2626; font-size: 22px; margin-top: 10px; margin-bottom: 12px; font-weight: 900; }
          h2 { color: #0284c7; margin-top: 22px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; font-size: 16px; font-weight: 800; }
          h3 { color: #0f172a; margin-top: 14px; font-size: 14px; font-weight: 700; }
          .stats-bar { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 20px; }
          .chapter-box { background: #f8fafc; border-right: 4px solid #dc2626; border-top: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 14px; margin-bottom: 14px; border-radius: 6px; page-break-inside: avoid; }
          .visual-cue { background: #e0f2fe; color: #0369a1; padding: 6px 10px; border-radius: 6px; font-size: 11px; margin-top: 8px; font-weight: 600; }
          .timestamp { background: #1e293b; color: #fff; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-family: monospace; }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
            .pdf-watermark {
              position: fixed;
              top: 45%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: left;">
          <button onclick="window.print()" style="background: #dc2626; color: white; border: none; padding: 10px 22px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">הדפס / שמור כ-PDF</button>
        </div>

        <!-- Watermark Displaying Script Version Number -->
        <div class="pdf-watermark">${finalWatermark}</div>

        <!-- Customizable Header with Project Title & Version -->
        <div class="pdf-header">
          <div>
            <div class="pdf-header-title">${finalHeaderTitle}</div>
            <div class="pdf-header-subtitle">תסריט יוטיוב מורשה - ${finalWatermark}</div>
          </div>
          <div class="pdf-header-meta">
            נוצר ב: ${new Date(result.generatedAt).toLocaleDateString('he-IL')}<br>
            אורך: כ-${totalWordCount} מילים (${estReadingTimeFormatted})
          </div>
        </div>

        <h1>${result.mainTitle}</h1>
        <div class="stats-bar">
          <strong>זמן הקראה משוער:</strong> ${estReadingTimeFormatted} | 
          <strong>סה"כ מילים:</strong> ${totalWordCount} מילים | 
          <strong>מספר פרקים:</strong> ${result.chapters.length} פרקים |
          <strong>גרסה:</strong> ${finalWatermark}
        </div>

        <h2>Hook (10 שניות)</h2>
        <p>${result.hookText}</p>

        <h2>הקדמה (Intro)</h2>
        <p>${result.introText}</p>

        <h2>פרקי התסריט</h2>
        ${result.chapters
          .map(
            (c, i) => `
          <div class="chapter-box">
            <h3><span class="timestamp">${c.timestamp}</span> פרק ${i + 1}: ${c.title}</h3>
            <p><strong>תמצית:</strong> ${c.summary}</p>
            <p style="white-space: pre-wrap;">${c.scriptText}</p>
            ${c.visualCue ? `<div class="visual-cue">🎥 הנחיה ויזואלית B-Roll: ${c.visualCue}</div>` : ''}
          </div>
        `
          )
          .join('')}

        <h2>הנעה לפעולה (Call To Action)</h2>
        <p>${result.ctaText}</p>

        <h2>תגיות SEO</h2>
        <p>${formattedAllSeoTagsString}</p>

        <h2>תיאור ל-YouTube</h2>
        <pre style="background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; white-space: pre-wrap;">${
          result.youtubeDescription
        }</pre>

        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="bg-[#11141b] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden dir-rtl text-right">
      
      {/* Focus / Teleprompter Reading Modal */}
      {isFocusModalOpen && (
        <FocusReadingModal
          result={result}
          onClose={() => setIsFocusModalOpen(false)}
        />
      )}

      {/* Top Banner */}
      <div className="p-6 bg-[#11141b] border-b border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-cyan-400 bg-[#1e293b] border border-[#334155] px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              תסריט מאוחד מוכן!
            </span>
            <span className="text-xs text-slate-400">
              נוצר ב-{new Date(result.generatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>נשמר אוטומטית ({lastAutoSavedAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {result.mainTitle}
          </h2>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          
          {/* Focus Reading Mode Button */}
          <button
            onClick={() => setIsFocusModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl shadow-lg shadow-red-900/20 transition flex items-center gap-1.5"
            title="פתח מצב קריאה וטלפרומפטר ללא הסחות דעת"
          >
            <Maximize2 className="w-4 h-4" />
            <span>מצב קריאה וטלפרומפטר</span>
          </button>

          {/* Export to Google Docs */}
          <button
            onClick={handleExportGDocs}
            disabled={isExportingGDocs}
            className="px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
            title="ייצא את התסריט ישירות ל-Google Docs"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>{isExportingGDocs ? 'יוצר מסמך...' : 'ייצא ל-Google Docs'}</span>
          </button>

          {/* Copy Full Script */}
          <button
            onClick={() => handleCopy(buildFullScriptText(), 'fullScript')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-xl transition flex items-center gap-1.5"
            title="העתק את כל התסריט ללוח בלחיצה אחת"
          >
            {copiedKey === 'fullScript' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedKey === 'fullScript' ? 'הועתק!' : 'העתק תסריט'}</span>
          </button>

          <button
            onClick={handleDownloadMd}
            className="px-3 py-2 text-xs font-semibold text-slate-200 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-xl transition flex items-center gap-1.5"
            title="הורד קובץ Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Markdown</span>
          </button>

          <button
            onClick={handleDownloadTxt}
            className="px-3 py-2 text-xs font-semibold text-slate-200 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-xl transition flex items-center gap-1.5"
            title="הורד קובץ טקסט (.txt)"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>TXT</span>
          </button>

          <button
            onClick={() => {
              const activeV = versions.find((v) => v.id === activeVersionId);
              setPdfHeaderTitle(result.mainTitle);
              setPdfWatermarkText(activeV ? activeV.versionName : 'גרסה 1');
              setIsPdfModalOpen(true);
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-200 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-xl transition flex items-center gap-1.5"
            title="ייצא / הדפס קובץ PDF מעוצב עם כותרת מותאמת וסימן מים"
          >
            <Printer className="w-3.5 h-3.5 text-rose-400" />
            <span>PDF</span>
          </button>

          {onClearSavedScript && (
            <button
              onClick={onClearSavedScript}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition border border-transparent hover:border-rose-500/20"
              title="מחק תסריט שמור"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Google Docs Export Status Banner */}
      {gdocsUrl && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-3 px-6 flex items-center justify-between gap-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {gdocsIsCopied
                ? 'התסריט הועתק ללוח ונפתח חלון Google Docs חדש! לחץ Ctrl+V ב-Google Docs להדבקה מיידית.'
                : 'מסמך התסריט נוצר בהצלחה בחשבון ה-Google Docs שלך!'}
            </span>
          </div>
          <a
            href={gdocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold rounded-lg transition flex items-center gap-1 shrink-0"
          >
            <span>{gdocsIsCopied ? 'מעבר ל-Google Docs (Ctrl+V)' : 'פתח ב-Google Docs'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {gdocsError && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 p-3 px-6 flex items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{gdocsError}</span>
          </div>
          <button
            onClick={handleExportGDocs}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold rounded-lg transition"
          >
            נסה שוב
          </button>
        </div>
      )}

      {/* Version History Toolbar */}
      <div className="bg-[#0e1117] border-b border-[#1e293b] px-6 py-2.5 flex items-center justify-between gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold text-slate-300">ניהול גרסאות תסריטים:</span>
          
          <select
            value={activeVersionId}
            onChange={(e) => {
              const val = e.target.value;
              setActiveVersionId(val);
              if (val === 'current') return;
              const selected = versions.find((v) => v.id === val);
              if (selected && onSelectVersion) {
                onSelectVersion(selected.result);
              }
            }}
            className="bg-[#1e293b] border border-[#334155] text-white px-3 py-1 rounded-lg outline-none cursor-pointer text-xs font-medium"
          >
            <option value="current">נוכחי: {result.mainTitle.substring(0, 30)}...</option>
            {versions.map((ver) => (
              <option key={ver.id} value={ver.id}>
                {ver.versionName} ({ver.optionsSummary})
              </option>
            ))}
          </select>

          {activeVersionId !== 'current' && (
            <button
              onClick={(e) => handleDeleteVersion(activeVersionId, e)}
              className="p-1 text-slate-400 hover:text-rose-400 transition"
              title="מחק גרסה נבחרת זו"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={handleSaveVersion}
          className="px-3 py-1 text-xs font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>שמור כגרסה חדשה להשוואה</span>
        </button>
      </div>

      {/* Publishing Deadline Banner */}
      <div className="p-4 bg-[#0a0c10] border-b border-[#1e293b]">
        <ScriptDeadlineBanner
          deadline={result.deadline}
          onUpdateDeadline={handleUpdateDeadline}
        />
      </div>

      {/* Script Analytics Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#0a0c10] border-b border-[#1e293b]">
        <div className="bg-[#11141b] border border-[#1e293b] rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">מונה מילים כולל</div>
            <div className="text-sm font-bold text-white">
              ~{totalWordCount.toLocaleString('he-IL')} מילים
            </div>
          </div>
        </div>

        <div className="bg-[#11141b] border border-[#1e293b] rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Clock className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">זמן הקראה משוער (קצב 140 מ/דק')</div>
            <div className="text-sm font-bold text-cyan-300">
              {estReadingTimeFormatted}
            </div>
          </div>
        </div>

        <div className="bg-[#11141b] border border-[#1e293b] rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Tag className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">תגיות SEO ופרקים</div>
            <div className="text-sm font-bold text-white">
              {seoTagsList.length} תגיות SEO | {result.chapters.length} פרקים
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#1e293b] bg-[#0a0c10] p-2 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('chapters')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'chapters'
              ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>חלוקה לפרקים וטיים-סטאמפס ({result.chapters?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('visual_editor')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'visual_editor'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-900/30'
              : 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>עורך חזותי וסידור פרקים (Drag & Drop)</span>
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'seo'
              ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
          }`}
        >
          <Tag className="w-4 h-4 text-amber-400" />
          <span>תגיות SEO מומלצות ({seoTagsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
          }`}
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>גרף טון רגשי והתפלגות מילים</span>
        </button>

        <button
          onClick={() => setActiveTab('full')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'full'
              ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>תסריט מלא להקראה</span>
        </button>

        <button
          onClick={() => setActiveTab('titles')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'titles'
              ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>כותרות ותמונות ממוזערות ({result.titles?.length || 0})</span>
        </button>
      </div>

      {/* Script Search Bar */}
      <div className="bg-[#0e1117] border-b border-[#1e293b] p-3 px-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפש מילת מפתח, נושא או משפט בתוך התסריט..."
            className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pr-9 pl-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {searchQuery.trim() && (
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg shrink-0">
            {searchMatchCount > 0
              ? `נמצאו ${searchMatchCount} מופעים ל-'${searchQuery}'`
              : `לא נמצאו מופעים ל-'${searchQuery}'`}
          </span>
        )}
      </div>

      {/* Tab Content Body */}
      <div className="p-6">
        
        {/* TAB VISUAL EDITOR */}
        {activeTab === 'visual_editor' && (
          <VisualScriptEditor
            chapters={result.chapters}
            onChangeChapters={handleUpdateChapters}
          />
        )}

        {/* TAB 1: CHAPTERS & TIMESTAMPS */}
        {activeTab === 'chapters' && (
          <div className="space-y-6">
            
            {/* YouTube Description Box Banner */}
            <div className="bg-[#0a0c10] border border-[#1e293b] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <Video className="w-4 h-4 text-cyan-400" />
                  <span>תיאור מוכן להעתקה לתיאור ה-YouTube (כולל טיים-סטאמפס)</span>
                </div>
                <button
                  onClick={() => handleCopy(result.youtubeDescription, 'ytDesc')}
                  className="px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition flex items-center gap-1.5"
                >
                  {copiedKey === 'ytDesc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'ytDesc' ? 'הועתק!' : 'העתק תיאור יוטיוב'}</span>
                </button>
              </div>

              <pre className="bg-[#11141b] p-3.5 rounded-xl text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto border border-[#1e293b]">
                {highlightText(result.youtubeDescription)}
              </pre>

              {result.hashtags && result.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {result.hashtags.map((tag, idx) => (
                    <span key={idx} className="text-[11px] text-red-400 bg-red-600/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                      #{tag.replace(/^#/, '')}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Hook & Intro highlight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0a0c10] border border-red-500/30 rounded-2xl p-4 space-y-1.5">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <Play className="w-3 h-3 text-red-500" /> ה-Hook ל-10 השניות הראשונות
                </span>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  "{highlightText(result.hookText)}"
                </p>
              </div>

              <div className="bg-[#0a0c10] border border-[#1e293b] rounded-2xl p-4 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  הקדמה (Intro)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {highlightText(result.introText)}
                </p>
              </div>
            </div>

            {/* Chapters Timeline List */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-500" />
                  <span>פרקי הסרטון ({result.chapters.length})</span>
                </div>
                <span className="text-xs text-slate-400 font-normal">
                  כל פרק כולל כפתור העתקה נפרד
                </span>
              </h3>

              <div className="relative border-r-2 border-red-500/30 pr-4 sm:pr-6 space-y-6">
                {result.chapters.map((chapter, idx) => {
                  const chapWordCount = chapter.scriptText ? chapter.scriptText.split(/\s+/).filter(Boolean).length : 0;
                  const chapSecs = Math.round((chapWordCount / 140) * 60);
                  const chapMins = Math.floor(chapSecs / 60);
                  const chapRemSecs = chapSecs % 60;
                  const chapTimeStr = chapMins > 0 ? `${chapMins} דק' ו-${chapRemSecs} שנ'` : `${chapRemSecs} שנ'`;

                  return (
                    <div key={idx} className="relative group">
                      <div className="absolute -right-[23px] sm:-right-[31px] top-1.5 w-4 h-4 rounded-full bg-[#0a0c10] border-2 border-red-500 group-hover:scale-125 transition duration-200" />

                      <div className="bg-[#0a0c10] border border-[#1e293b] rounded-2xl p-5 space-y-3 hover:border-[#334155] transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-mono font-bold text-cyan-400 bg-[#1e293b] border border-[#334155] px-2.5 py-1 rounded-lg">
                              {chapter.timestamp}
                            </span>
                            <h4 className="text-sm font-bold text-white">
                              פרק {idx + 1}: {highlightText(chapter.title)}
                            </h4>
                            <span className="text-[11px] text-slate-400 bg-[#11141b] px-2 py-0.5 rounded-md border border-[#1e293b]">
                              ~{chapWordCount} מילים | {chapTimeStr}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                              onClick={() =>
                                handleCopy(
                                  `פרק ${idx + 1} [${chapter.timestamp}]: ${chapter.title}\n${chapter.scriptText}`,
                                  `chap-${idx}`
                                )
                              }
                              className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-lg transition flex items-center gap-1"
                              title="העתק פרק זה בלבד"
                            >
                              {copiedKey === `chap-${idx}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-300" />
                              )}
                              <span>{copiedKey === `chap-${idx}` ? 'הועתק!' : 'העתק פרק'}</span>
                            </button>

                            {onOpenChatWithPrompt && (
                              <button
                                onClick={() => onOpenChatWithPrompt(`אנא הרחב ושפר את פרק ${idx + 1} (${chapter.title}) בתסריט.`)}
                                className="text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                              >
                                <MessageSquarePlus className="w-3.5 h-3.5 text-cyan-400" />
                                <span>שפר ב-AI</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 italic">
                          תמצית: {highlightText(chapter.summary)}
                        </p>

                        <div className="bg-[#11141b] rounded-xl p-4 border border-[#1e293b] text-xs text-slate-200 leading-relaxed font-sans space-y-2 whitespace-pre-line">
                          {highlightText(chapter.scriptText)}
                        </div>

                        {chapter.visualCue && (
                          <div className="bg-[#1e293b]/60 border border-[#334155] text-cyan-300 text-xs p-3 rounded-xl flex items-start gap-2">
                            <span className="font-bold shrink-0 text-cyan-400">🎥 הנחיות ויזואליות B-Roll:</span>
                            <span>{highlightText(chapter.visualCue)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-[#0a0c10] border border-red-500/30 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                הנעה לפעולה וסיום הסרטון (Call To Action)
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {highlightText(result.ctaText)}
              </p>
            </div>

          </div>
        )}

        {/* TAB 2: SEO TAGS & KEYWORDS */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="bg-[#0a0c10] border border-[#1e293b] rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-400" />
                    <span>מילות מפתח ותגיות SEO מומלצות ליוטיוב ({seoTagsList.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    תגיות אלו מותאמות לאלגוריתם הקידום והחיפוש ב-YouTube Studio. לחץ להעתקה מהירה.
                  </p>
                </div>

                <button
                  onClick={() => handleCopy(formattedAllSeoTagsString, 'allSeoTags')}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-amber-500/10"
                >
                  {copiedKey === 'allSeoTags' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'allSeoTags' ? 'כל התגיות הועתקו!' : 'העתק את כל התגיות בלחיצה אחת'}</span>
                </button>
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                {seoTagsList.map((st, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCopy(st.tag, `tag-${idx}`)}
                    className="group bg-[#11141b] hover:bg-[#1e293b] border border-[#334155] hover:border-amber-400/50 p-2.5 px-3.5 rounded-xl transition text-right flex items-center gap-2"
                  >
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-300">
                      {st.tag}
                    </span>
                    {st.category && (
                      <span className="text-[10px] bg-[#1e293b] text-slate-400 px-1.5 py-0.5 rounded font-mono">
                        {st.category}
                      </span>
                    )}
                    {copiedKey === `tag-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Ready to Paste Box */}
              <div className="pt-4 border-t border-[#1e293b] space-y-2">
                <span className="text-xs font-bold text-slate-300">
                  טקסט תגיות מופרד בפסיקים (מוכן להדבקה ישירה ב-YouTube Studio):
                </span>
                <pre className="bg-[#11141b] p-3 rounded-xl text-xs text-slate-300 font-mono whitespace-pre-wrap border border-[#1e293b]">
                  {formattedAllSeoTagsString}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EMOTIONAL TONE & ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Script Metrics Dashboard */}
            <ScriptMetricsDashboard result={result} />

            {/* Emotional Tone Area Chart */}
            <div className="bg-[#0a0c10] border border-[#1e293b] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>גרף דינמיקת 'טון הרגש' (Emotional Engagement Curve)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ניתוח רמת העניין, המתח והרגש לאורך דקות התסריט לשמירה על קצב דינמי
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  Dynamics Analyzer
                </span>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={emotionalData}>
                    <defs>
                      <linearGradient id="colorEmotion" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="chapterTitle"
                      stroke="#64748b"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickFormatter={(val) => (val.length > 15 ? `${val.substring(0, 15)}...` : val)}
                    />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#11141b',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: number) => [`${val}% עוצמה`, 'מדד רגשי']}
                    />
                    <Area
                      type="monotone"
                      dataKey="emotionalScore"
                      stroke="#ef4444"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorEmotion)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Emotion Notes per Chapter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {emotionalData.map((ep, idx) => (
                  <div key={idx} className="bg-[#11141b] border border-[#1e293b] p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>פרק {ep.chapterIndex}: {ep.chapterTitle}</span>
                      <span className="text-red-400 font-mono">{ep.emotionalScore}%</span>
                    </div>
                    <div className="text-[11px] text-cyan-300 font-medium">
                      🎯 {ep.emotionLabel}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ⏱️ {ep.pacingNote}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chapter Balance Pie Chart */}
            <div className="bg-[#0a0c10] border border-[#1e293b] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-cyan-400" />
                    <span>גרף התפלגות אורך הפרקים (Chapter Balance)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ויזואליזציה של חלוקת העומס והמילים בין פרקי הסרטון השונים
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center pt-2">
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="words"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#11141b',
                          borderColor: '#1e293b',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`~${value} מילים`, 'כמות מילים']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-300 mb-2">פירוט מילים ואחוזים מכלל התסריט:</div>
                  {pieData.map((pd, idx) => {
                    const percentage = totalWordCount > 0 ? Math.round((pd.words / totalWordCount) * 100) : 0;
                    return (
                      <div
                        key={idx}
                        className="bg-[#11141b] border border-[#1e293b] p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          <span className="font-bold text-white truncate">{pd.fullTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono">
                          <span className="text-slate-300">~{pd.words} מילים</span>
                          <span className="text-cyan-400 font-bold bg-[#1e293b] px-2 py-0.5 rounded-md border border-[#334155]">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: FULL SCRIPT MARKDOWN */}
        {activeTab === 'full' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                טקסט התסריט המלא בפורמט דיבור רציף להקראה
              </span>
              <button
                onClick={() => handleCopy(buildFullScriptText(), 'fullMarkdown')}
                className="px-3 py-1.5 text-xs text-slate-200 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-lg transition flex items-center gap-1.5"
              >
                {copiedKey === 'fullMarkdown' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>העתק תסריט מלא</span>
              </button>
            </div>

            <div className="bg-[#0a0c10] border border-[#1e293b] rounded-2xl p-6 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-[600px] overflow-y-auto space-y-4">
              {highlightText(buildFullScriptText())}
            </div>
          </div>
        )}

        {/* TAB 5: TITLES & THUMBNAILS */}
        {activeTab === 'titles' && (
          <div className="space-y-6">
            <ThumbnailPreviewCard
              result={result}
              selectedTitleIndex={selectedTitleIndex}
              onSelectTitleIndex={(idx) => setSelectedTitleIndex(idx)}
            />

            <div className="text-xs font-bold text-slate-300">
              הצעות נוספות לכותרות ויראליות שנכתבו עם עקרונות CTR פסיכולוגיים (לחץ לצפייה בכרזה):
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.titles.map((t, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedTitleIndex(idx)}
                  className={`bg-[#0a0c10] border rounded-2xl p-5 space-y-3 cursor-pointer transition group ${
                    selectedTitleIndex === idx
                      ? 'border-red-500 ring-1 ring-red-500/50'
                      : 'border-[#1e293b] hover:border-[#334155]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-red-400 bg-red-600/10 border border-red-500/20 px-2 py-0.5 rounded-full shrink-0">
                      אופציה #{idx + 1} {selectedTitleIndex === idx && '• (מוצגת בכרזה)'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(t.title, `title-${idx}`);
                      }}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b] transition"
                      title="העתק כותרת"
                    >
                      {copiedKey === `title-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <h4 className="text-sm font-black text-white group-hover:text-red-300 transition">
                    "{highlightText(t.title)}"
                  </h4>

                  <div className="bg-[#11141b] p-3 rounded-xl border border-[#1e293b] space-y-1.5 text-xs">
                    <div className="text-slate-400">
                      <strong className="text-cyan-400 font-semibold">זווית פסיכולוגית:</strong> {highlightText(t.hookAngle)}
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-red-400 font-semibold">רעיון לתמונת ממוזערת:</strong> {highlightText(t.thumbnailConcept)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF Export Modal */}
        {isPdfModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#11141b] border border-[#1e293b] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-right dir-rtl relative">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-bold text-white">הגדרות ייצא PDF מותאם אישית</h3>
                </div>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Header Title Field */}
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                    כותרת הפרויקט בראש העמוד (Header Title):
                  </label>
                  <input
                    type="text"
                    value={pdfHeaderTitle}
                    onChange={(e) => setPdfHeaderTitle(e.target.value)}
                    placeholder="הזן כותרת מותאמת אישית לראש העמוד..."
                    className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    כותרת זו תוצג בראש כל עמוד במסמך ה-PDF המעוצב.
                  </p>
                </div>

                {/* Watermark Script Version Field */}
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                    מספר/שם גרסת התסריט לסימן המים (Version Watermark):
                  </label>
                  <input
                    type="text"
                    value={pdfWatermarkText}
                    onChange={(e) => setPdfWatermarkText(e.target.value)}
                    placeholder="לדוגמה: גרסה 1, DRAFT v2, מהדורה סופית..."
                    className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    טקסט זה יוצג כסימן מים באלכסון ברקע כל עמודי ה-PDF, וכן בכותרת העליונה.
                  </p>
                </div>

                <div className="bg-[#0a0c10] p-3 rounded-xl border border-[#1e293b] text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-amber-400">💡 דגשי ייצא ל-PDF:</div>
                  <p className="text-[11px] text-slate-400">
                    הקובץ כולל עיצוב דפוס מותאם, חלוקת פרקים נקיים, טיים-סטאמפס, תגיות SEO ותיאור מוכן ליוטיוב.
                  </p>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1e293b]">
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                >
                  ביטול
                </button>
                <button
                  onClick={() => {
                    handlePrintPdf(pdfHeaderTitle, pdfWatermarkText);
                    setIsPdfModalOpen(false);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-900/30 transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>הדפס / ייצא ל-PDF כעת</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
