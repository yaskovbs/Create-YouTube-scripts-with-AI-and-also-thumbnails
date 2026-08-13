import React, { useState } from 'react';
import { GeneratedResult } from '../types';
import { Clock, BookOpen, Brain, Activity, BarChart2, Layers, CheckCircle, Sparkles, AlertTriangle, FileSpreadsheet, Download } from 'lucide-react';
import { exportMetricsToCsv } from '../lib/exportCsv';

interface ScriptMetricsDashboardProps {
  result: GeneratedResult;
}

export const ScriptMetricsDashboard: React.FC<ScriptMetricsDashboardProps> = ({ result }) => {
  const [wpmRate, setWpmRate] = useState<number>(140); // 120, 140, 160

  // Calculation Breakdown
  const hookWords = result.hookText ? result.hookText.split(/\s+/).filter(Boolean).length : 0;
  const introWords = result.introText ? result.introText.split(/\s+/).filter(Boolean).length : 0;
  const ctaWords = result.ctaText ? result.ctaText.split(/\s+/).filter(Boolean).length : 0;
  const chaptersWords = (result.chapters || []).reduce(
    (acc, c) => acc + (c.scriptText ? c.scriptText.split(/\s+/).filter(Boolean).length : 0),
    0
  );
  const totalWordCount = hookWords + introWords + ctaWords + chaptersWords;

  // Reading & Speech Time
  const totalSeconds = Math.round((totalWordCount / wpmRate) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Text Complexity Calculation Algorithm
  const fullText = `${result.hookText} ${result.introText} ${result.ctaText} ${result.chapters.map(c => c.scriptText).join(' ')}`;
  const sentences = fullText.split(/[.!?:]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  const avgWordsPerSentence = Math.round((totalWordCount / sentenceCount) * 10) / 10;

  const wordsList = fullText.split(/\s+/).filter((w) => w.length > 0);
  const longWordsCount = wordsList.filter((w) => w.length >= 7).length;
  const longWordsRatio = Math.round((longWordsCount / Math.max(1, totalWordCount)) * 100);

  const uniqueWords = new Set(wordsList.map((w) => w.toLowerCase().replace(/[^\w\u0590-\u05FF]/g, ''))).size;
  const vocabularyDiversity = Math.round((uniqueWords / Math.max(1, totalWordCount)) * 100);

  // Score formula: (0-100)
  // Sentence length impact: > 15 words increases complexity
  // Long words ratio impact: > 20% increases complexity
  let complexityScore = Math.min(
    100,
    Math.max(15, Math.round(avgWordsPerSentence * 2.8 + longWordsRatio * 1.5 + vocabularyDiversity * 0.3))
  );

  let complexityCategory = 'סטנדרט יוטיוב קולח ומקצועי';
  let complexityBadgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  let complexityBarColor = 'bg-cyan-500';

  if (complexityScore < 45) {
    complexityCategory = 'נגישה ופשוטה להבנה (נוחה לקהל הרחב)';
    complexityBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    complexityBarColor = 'bg-emerald-500';
  } else if (complexityScore > 75) {
    complexityCategory = 'תסריט מעמיק, טכני ומורכב (Deep Dive)';
    complexityBadgeColor = 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    complexityBarColor = 'bg-purple-500';
  }

  return (
    <div className="bg-[#0a0c10] border border-[#1e293b] rounded-2xl p-6 space-y-6 dir-rtl text-right">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-4 flex-wrap gap-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-red-500" />
          <span>דשבורד מדדי תסריט (Script Analytics & Metrics Dashboard)</span>
        </h3>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportMetricsToCsv(result, wpmRate)}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="ייצא מדדים וסטטיסטיקות לקובץ CSV (מותאם לאקסל)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>ייצא מדדים ל-Excel (CSV)</span>
            <Download className="w-3.5 h-3.5 opacity-70" />
          </button>
          <span className="text-xs text-slate-400 hidden sm:inline">ניתוח לקסיקלי וקצב הקראה בזמן אמת</span>
        </div>
      </div>

      {/* Primary 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Metric 1: Word Count */}
        <div className="bg-[#11141b] border border-[#1e293b] rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              כמות מילים כוללת
            </span>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20 font-mono">
              Word Count
            </span>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {totalWordCount.toLocaleString()} <span className="text-sm font-normal text-slate-400 font-sans">מילים</span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1 border-t border-[#1e293b] pt-2">
            <div className="flex justify-between">
              <span>פתיח ו-Hook:</span>
              <span className="font-mono text-slate-200">{hookWords + introWords} מילים</span>
            </div>
            <div className="flex justify-between">
              <span>פרקים ראשיים ({result.chapters?.length || 0}):</span>
              <span className="font-mono text-slate-200">{chaptersWords} מילים</span>
            </div>
            <div className="flex justify-between">
              <span>הנעה לפעולה (CTA):</span>
              <span className="font-mono text-slate-200">{ctaWords} מילים</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Estimated Reading / Speaking Time */}
        <div className="bg-[#11141b] border border-[#1e293b] rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              זמן הקראה / וידאו משוער
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">
              Reading Time
            </span>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}{' '}
            <span className="text-sm font-normal text-slate-400 font-sans">דקות</span>
          </div>

          {/* WPM Selector */}
          <div className="pt-1 border-t border-[#1e293b]">
            <span className="text-[11px] text-slate-400 block mb-1">קצב דיבור/הקראה:</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { rate: 120, label: 'איטי (120)' },
                { rate: 140, label: 'רשמי (140)' },
                { rate: 160, label: 'קצבי (160)' },
              ].map((m) => (
                <button
                  key={m.rate}
                  onClick={() => setWpmRate(m.rate)}
                  className={`py-1 text-[10px] font-bold rounded-lg border transition ${
                    wpmRate === m.rate
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-[#0a0c10] text-slate-400 border-[#1e293b] hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metric 3: Complexity Level Metric */}
        <div className="bg-[#11141b] border border-[#1e293b] rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-purple-400" />
              רמת מורכבות הניתוח והטקסט
            </span>
            <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20 font-mono">
              Complexity Score
            </span>
          </div>
          <div className="text-3xl font-black text-white font-mono flex items-baseline gap-2">
            {complexityScore}<span className="text-sm font-normal text-slate-400">/100</span>
          </div>

          {/* Meter Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-[#0a0c10] h-2.5 rounded-full overflow-hidden border border-[#1e293b]">
              <div
                className={`h-full ${complexityBarColor} transition-all duration-500`}
                style={{ width: `${complexityScore}%` }}
              />
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border inline-block ${complexityBadgeColor}`}>
              {complexityCategory}
            </span>
          </div>
        </div>

      </div>

      {/* Additional Deep Analysis Stats */}
      <div className="bg-[#11141b] border border-[#1e293b] rounded-2xl p-5 space-y-4">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>סטטיסטיקת מבנה משפטים ואוצר מילים:</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#0a0c10] p-3 rounded-xl border border-[#1e293b]">
            <span className="text-slate-400 text-[11px] block">ממוצע מילים למשפט:</span>
            <span className="text-base font-bold text-white font-mono">{avgWordsPerSentence} מילים</span>
          </div>

          <div className="bg-[#0a0c10] p-3 rounded-xl border border-[#1e293b]">
            <span className="text-slate-400 text-[11px] block">יחס מילים מורכבות:</span>
            <span className="text-base font-bold text-cyan-400 font-mono">{longWordsRatio}%</span>
          </div>

          <div className="bg-[#0a0c10] p-3 rounded-xl border border-[#1e293b]">
            <span className="text-slate-400 text-[11px] block">גיוון אוצר מילים:</span>
            <span className="text-base font-bold text-purple-300 font-mono">{vocabularyDiversity}%</span>
          </div>

          <div className="bg-[#0a0c10] p-3 rounded-xl border border-[#1e293b]">
            <span className="text-slate-400 text-[11px] block">מספר פרקים / פסקאות:</span>
            <span className="text-base font-bold text-amber-400 font-mono">{result.chapters?.length || 0} פרקים</span>
          </div>
        </div>
      </div>

    </div>
  );
};
