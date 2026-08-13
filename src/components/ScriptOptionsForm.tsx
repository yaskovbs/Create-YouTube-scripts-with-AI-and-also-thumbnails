import React from 'react';
import { Sliders, Sparkles, Clock, Compass, Users, Globe, MessageSquareCode, Loader2, Bookmark, Layers, Film, Calendar } from 'lucide-react';
import { ScriptOptions, TargetDuration, ScriptTone, ChapterControlMode, ChapterLengthRange } from '../types';

interface ScriptOptionsFormProps {
  options: ScriptOptions;
  onChangeOptions: (updated: Partial<ScriptOptions>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  videoCount: number;
}

export const ScriptOptionsForm: React.FC<ScriptOptionsFormProps> = ({
  options,
  onChangeOptions,
  onGenerate,
  isGenerating,
  videoCount,
}) => {
  const durations: { id: TargetDuration; label: string; desc: string }[] = [
    { id: 'shorts', label: 'YouTube Shorts', desc: 'סרטון אנכי קצבי עד 60 שניות (150-200 מילים)' },
    { id: 'short', label: 'סרטון קצר (3-5 דק\')', desc: 'קולע, ממוקד ומהיר (500-800 מילים)' },
    { id: 'standard', label: 'סרטון רגיל (8-12 דק\')', desc: 'האורך האידיאלי ביוטיוב (1,200-1,800 מילים)' },
    { id: 'deep', label: 'סרטון מעמיק (15-20 דק\')', desc: 'מדריך מקיף ומושקע (2,500-3,500 מילים)' },
  ];

  const tones: { id: ScriptTone; label: string; icon: string }[] = [
    { id: 'engaging', label: 'מרתק וסוחף', icon: '🔥' },
    { id: 'educational', label: 'לימודי וברור', icon: '💡' },
    { id: 'storytelling', label: 'סיפורי (Storytelling)', icon: '📖' },
    { id: 'humorous', label: 'קליל והומוריסטי', icon: '😂' },
    { id: 'analytical', label: 'אנליטי ומבוסס עובדות', icon: '📊' },
    { id: 'professional', label: 'מקצועי ורשמי', icon: '💼' },
  ];

  const currentChapterMode: ChapterControlMode = options.chapterControlMode || 'auto';
  const currentChapterCount = options.chapterCount || 5;
  const currentChapterLength: ChapterLengthRange = options.chapterLengthRange || 'medium_3_5';

  return (
    <div className="bg-[#11141b] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-6 dir-rtl text-right">
      
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-4">
        <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">2. הגדרות, אופי והגדרת פרקים</h2>
          <p className="text-xs text-slate-400">התאם את הסגנון, אורך הסרטון והגדרת הפרקים האוטומטיים</p>
        </div>
      </div>

      <div className="space-y-5">
        
        {/* Duration selector */}
        <div>
          <label className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              <span>אורך הסרטון המבוקש לפי קטגוריה</span>
            </div>
            <span className="text-[11px] text-cyan-400 font-medium">או הגדר כמות מילים ודקות מדויקת למטה 👇</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {durations.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onChangeOptions({ targetDuration: d.id, customTargetWords: undefined, customTargetMinutes: undefined })}
                className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between ${
                  options.targetDuration === d.id && !options.customTargetWords && !options.customTargetMinutes
                    ? 'bg-[#1e293b] border-red-500 text-white shadow-md shadow-red-900/20'
                    : 'bg-[#0a0c10] border-[#1e293b] text-slate-400 hover:border-[#334155] hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs text-slate-100 mb-1">{d.label}</div>
                <div className="text-[11px] text-slate-400 leading-snug">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Precision Target Word Count & Duration in Minutes */}
        <div className="bg-[#0a0c10] border border-[#1e293b] rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-2.5">
            <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>הגדרת מספר מילים וזמן מדויק לתסריט (Custom Word Count & Duration)</span>
            </label>
            {(options.customTargetWords || options.customTargetMinutes) && (
              <button
                type="button"
                onClick={() => onChangeOptions({ customTargetWords: undefined, customTargetMinutes: undefined })}
                className="text-[11px] text-red-400 hover:text-red-300 underline self-end sm:self-auto"
              >
                איפוס להגדרות ברירת מחדל
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                כמות מילים מדויקת לתסריט:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="50"
                  value={options.customTargetWords ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    const computedMins = val ? Math.round((val / 140) * 10) / 10 : undefined;
                    onChangeOptions({ customTargetWords: val, customTargetMinutes: computedMins });
                  }}
                  placeholder="לדוגמה: 1200 מילים"
                  className="w-full bg-[#11141b] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-sans pointer-events-none">
                  מילים
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                אורך מדויק בדקות (וידאו):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.5"
                  max="120"
                  step="0.5"
                  value={options.customTargetMinutes ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : undefined;
                    const computedWords = val ? Math.round(val * 140) : undefined;
                    onChangeOptions({ customTargetMinutes: val, customTargetWords: computedWords });
                  }}
                  placeholder="לדוגמה: 8.5 דקות"
                  className="w-full bg-[#11141b] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-sans pointer-events-none">
                  דקות
                </span>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="pt-1">
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">בחירה מהירה לפי מילים/דקות:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { words: 300, mins: 2, label: '300 מילים (כ-2 דק\')' },
                { words: 700, mins: 5, label: '700 מילים (כ-5 דק\')' },
                { words: 1200, mins: 8.5, label: '1,200 מילים (כ-8.5 דק\')' },
                { words: 2000, mins: 14, label: '2,000 מילים (כ-14 דק\')' },
                { words: 3500, mins: 25, label: '3,500 מילים (כ-25 דק\')' },
              ].map((p) => {
                const isSelected = options.customTargetWords === p.words;
                return (
                  <button
                    key={p.words}
                    type="button"
                    onClick={() => onChangeOptions({ customTargetWords: p.words, customTargetMinutes: p.mins })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                        : 'bg-[#11141b] text-slate-400 border-[#1e293b] hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chapter Division Controls */}
        <div className="bg-[#0a0c10] border border-[#1e293b] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>הגדרת חלוקה לפרקים (Chapter Division Control)</span>
            </label>
            <span className="text-[11px] bg-[#1e293b] text-slate-300 px-2 py-0.5 rounded-md border border-[#334155]">
              תכונה אוטומטית ב-Gemini
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => onChangeOptions({ chapterControlMode: 'auto' })}
              className={`p-3 rounded-xl border text-right transition ${
                currentChapterMode === 'auto'
                  ? 'bg-[#1e293b] border-cyan-500 text-cyan-300'
                  : 'bg-[#11141b] border-[#1e293b] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-bold text-xs">חלוקה אוטומטית</div>
              <div className="text-[10px] text-slate-400 mt-0.5">לפי הנושאים בתמליל המקור</div>
            </button>

            <button
              type="button"
              onClick={() => onChangeOptions({ chapterControlMode: 'exact_count' })}
              className={`p-3 rounded-xl border text-right transition ${
                currentChapterMode === 'exact_count'
                  ? 'bg-[#1e293b] border-cyan-500 text-cyan-300'
                  : 'bg-[#11141b] border-[#1e293b] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-bold text-xs">מספר פרקים מוגדר</div>
              <div className="text-[10px] text-slate-400 mt-0.5">קבע כמות פרקים מדויקת</div>
            </button>

            <button
              type="button"
              onClick={() => onChangeOptions({ chapterControlMode: 'chapter_length' })}
              className={`p-3 rounded-xl border text-right transition ${
                currentChapterMode === 'chapter_length'
                  ? 'bg-[#1e293b] border-cyan-500 text-cyan-300'
                  : 'bg-[#11141b] border-[#1e293b] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-bold text-xs">אורך פרק מבוקש</div>
              <div className="text-[10px] text-slate-400 mt-0.5">קבע טווח זמן מבוקש לפרק</div>
            </button>
          </div>

          {/* Sub-controls for Exact Count */}
          {currentChapterMode === 'exact_count' && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#11141b] p-3 rounded-lg border border-[#1e293b]">
              <span className="text-xs text-slate-300 font-medium">כמות הפרקים המבוקשת בתסריט:</span>
              <div className="flex items-center gap-2">
                {[3, 4, 5, 6, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onChangeOptions({ chapterCount: num })}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition border ${
                      currentChapterCount === num
                        ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-900/30'
                        : 'bg-[#0a0c10] text-slate-400 border-[#334155] hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sub-controls for Chapter Length */}
          {currentChapterMode === 'chapter_length' && (
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#11141b] p-3 rounded-lg border border-[#1e293b]">
              <button
                type="button"
                onClick={() => onChangeOptions({ chapterLengthRange: 'short_2_3' })}
                className={`p-2 rounded-lg text-xs border text-center transition ${
                  currentChapterLength === 'short_2_3'
                    ? 'bg-red-600/20 border-red-500 text-red-200 font-bold'
                    : 'bg-[#0a0c10] border-[#334155] text-slate-400 hover:text-slate-200'
                }`}
              >
                קצרים (2-3 דק' לפרק)
              </button>
              <button
                type="button"
                onClick={() => onChangeOptions({ chapterLengthRange: 'medium_3_5' })}
                className={`p-2 rounded-lg text-xs border text-center transition ${
                  currentChapterLength === 'medium_3_5'
                    ? 'bg-red-600/20 border-red-500 text-red-200 font-bold'
                    : 'bg-[#0a0c10] border-[#334155] text-slate-400 hover:text-slate-200'
                }`}
              >
                בינוניים (3-5 דק' לפרק)
              </button>
              <button
                type="button"
                onClick={() => onChangeOptions({ chapterLengthRange: 'long_6_10' })}
                className={`p-2 rounded-lg text-xs border text-center transition ${
                  currentChapterLength === 'long_6_10'
                    ? 'bg-red-600/20 border-red-500 text-red-200 font-bold'
                    : 'bg-[#0a0c10] border-[#334155] text-slate-400 hover:text-slate-200'
                }`}
              >
                מעמיקים (6-10 דק' לפרק)
              </button>
            </div>
          )}
        </div>

        {/* Series / Playlist Mode Toggle */}
        <div className="bg-[#0a0c10] border border-[#1e293b] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>מבנה סדרה מרובת פרקים (Series / Playlist Mode)</span>
                {options.seriesMode && (
                  <span className="text-[10px] bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                    פעיל
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                מתאים לשילוב של מספר רב של סרטונים יחד - בונה תסריט המשכי במבנה של סדרת יוטיוב עם טיזרים מעברים בין סרטון לסרטון.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChangeOptions({ seriesMode: !options.seriesMode })}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 border ${
              options.seriesMode
                ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-900/30'
                : 'bg-[#11141b] text-slate-300 border-[#1e293b] hover:border-[#334155]'
            }`}
          >
            {options.seriesMode ? 'סדרה פעילה ✓' : 'הפעל מבנה סדרה'}
          </button>
        </div>

        {/* Tone selector */}
        <div>
          <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-red-500" />
            <span>סגנון וטון הדיבור</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {tones.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeOptions({ tone: t.id })}
                className={`p-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 text-xs font-medium ${
                  options.tone === t.id
                    ? 'bg-red-600/20 border-red-500 text-red-200'
                    : 'bg-[#0a0c10] border-[#1e293b] text-slate-400 hover:border-[#334155] hover:text-slate-200'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Target Audience & Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-red-500" />
              <span>קהל יעד</span>
            </label>
            <input
              type="text"
              value={options.targetAudience}
              onChange={(e) => onChangeOptions({ targetAudience: e.target.value })}
              placeholder="למשל: יזמים, מתחילים ב-AI, צופים צעירים..."
              className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-red-500" />
              <span>שפת התסריט</span>
            </label>
            <select
              value={options.language}
              onChange={(e) => onChangeOptions({ language: e.target.value })}
              className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="Hebrew">עברית (Hebrew)</option>
              <option value="English">אנגלית (English)</option>
              <option value="Spanish">ספרדית (Spanish)</option>
              <option value="French">צרפתית (French)</option>
              <option value="Russian">רוסית (Russian)</option>
              <option value="Arabic">ערבית (Arabic)</option>
            </select>
          </div>
        </div>

        {/* Publishing Deadline */}
        <div>
          <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>תאריך יעד לפרסום הסרטון ביוטיוב (Deadline - אופציונלי)</span>
            </div>
            {options.deadline && (
              <button
                type="button"
                onClick={() => onChangeOptions({ deadline: undefined })}
                className="text-[11px] text-rose-400 hover:text-rose-300 underline"
              >
                בטל תאריך יעד
              </button>
            )}
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="datetime-local"
              value={options.deadline || ''}
              onChange={(e) => onChangeOptions({ deadline: e.target.value })}
              className="bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(18, 0, 0, 0);
                  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                  const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T18:00`;
                  onChangeOptions({ deadline: val });
                }}
                className="px-2.5 py-2 text-[11px] font-bold text-slate-300 bg-[#0a0c10] border border-[#1e293b] hover:border-amber-500 hover:text-white rounded-xl transition"
              >
                מחר ב-18:00
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 3);
                  d.setHours(18, 0, 0, 0);
                  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                  const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T18:00`;
                  onChangeOptions({ deadline: val });
                }}
                className="px-2.5 py-2 text-[11px] font-bold text-slate-300 bg-[#0a0c10] border border-[#1e293b] hover:border-amber-500 hover:text-white rounded-xl transition"
              >
                בעוד 3 ימים
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 7);
                  d.setHours(18, 0, 0, 0);
                  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                  const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T18:00`;
                  onChangeOptions({ deadline: val });
                }}
                className="px-2.5 py-2 text-[11px] font-bold text-slate-300 bg-[#0a0c10] border border-[#1e293b] hover:border-amber-500 hover:text-white rounded-xl transition"
              >
                בעוד שבוע
              </button>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div>
          <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <MessageSquareCode className="w-3.5 h-3.5 text-red-500" />
            <span>הנחיות מיוחדות ל-AI (אופציונלי)</span>
          </label>
          <input
            type="text"
            value={options.specialInstructions}
            onChange={(e) => onChangeOptions({ specialInstructions: e.target.value })}
            placeholder="למשל: שים דגש מיוחד על הטרנדים של 2026, הוסף אנקדוטה מצחיקה בפתיח..."
            className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

      </div>

      {/* Primary Action Button */}
      <div className="pt-3 border-t border-[#1e293b]">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || videoCount === 0}
          className="w-full py-4 px-6 rounded-2xl text-sm sm:text-base font-extrabold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-xl shadow-red-900/30 transition-all duration-300 transform active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 group"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span>ג'ימני מעבד את סרטוני המקור וכותב תסריט מחולק לפרקים...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
              <span>צור תסריט מאוחד מחולק לפרקים ב-AI</span>
            </>
          )}
        </button>

        {videoCount === 0 && (
          <p className="text-[11px] text-cyan-400 text-center mt-2">
            * אנא הוסף לפחות סרטון מקור אחד (או לחץ 'טען סרטוני מדגם') כדי להתחיל.
          </p>
        )}
      </div>

    </div>
  );
};
