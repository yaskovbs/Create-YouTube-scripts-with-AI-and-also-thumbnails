import React, { useState, useEffect, useRef } from 'react';
import { GeneratedResult } from '../types';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Type,
  Maximize2,
  Clock,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Volume2
} from 'lucide-react';

interface FocusReadingModalProps {
  result: GeneratedResult;
  onClose: () => void;
}

export const FocusReadingModal: React.FC<FocusReadingModalProps> = ({
  result,
  onClose,
}) => {
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('xl');
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(3); // 1 to 10
  const [wpmSpeed, setWpmSpeed] = useState<number>(140); // 100 to 220
  const contentRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Full script text calculation
  const hookWords = result.hookText ? result.hookText.split(/\s+/).filter(Boolean).length : 0;
  const introWords = result.introText ? result.introText.split(/\s+/).filter(Boolean).length : 0;
  const ctaWords = result.ctaText ? result.ctaText.split(/\s+/).filter(Boolean).length : 0;
  const chaptersWords = (result.chapters || []).reduce(
    (acc, c) => acc + (c.scriptText ? c.scriptText.split(/\s+/).filter(Boolean).length : 0),
    0
  );

  const totalWords = hookWords + introWords + ctaWords + chaptersWords;
  const totalSeconds = Math.round((totalWords / wpmSpeed) * 60);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const formattedTime = mins > 0 ? `${mins} דקות ו-${secs} שניות` : `${secs} שניות`;

  // Auto-scrolling effect
  useEffect(() => {
    if (!isAutoScrolling) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const scrollContainer = contentRef.current;
    if (!scrollContainer) return;

    let lastTime = performance.now();

    const step = (currentTime: number) => {
      const delta = currentTime - lastTime;
      if (delta > 20) {
        lastTime = currentTime;
        const pixelsToScroll = (scrollSpeed * 0.4) * (wpmSpeed / 140);
        scrollContainer.scrollTop += pixelsToScroll;

        // Stop if reached bottom
        if (
          scrollContainer.scrollTop + scrollContainer.clientHeight >=
          scrollContainer.scrollHeight - 5
        ) {
          setIsAutoScrolling(false);
          return;
        }
      }
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAutoScrolling, scrollSpeed, wpmSpeed]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsAutoScrolling((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // FontSize CSS class helper
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm':
        return 'text-base leading-relaxed';
      case 'md':
        return 'text-lg leading-relaxed';
      case 'lg':
        return 'text-xl leading-loose';
      case 'xl':
        return 'text-2xl sm:text-3xl leading-loose font-medium';
      case '2xl':
        return 'text-3xl sm:text-4xl leading-loose font-bold';
      default:
        return 'text-2xl leading-loose';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05070a]/95 backdrop-blur-md text-white flex flex-col dir-rtl text-right overflow-hidden animate-fadeIn">
      
      {/* Teleprompter Top Control Bar */}
      <div className="bg-[#0e1117] border-b border-[#1e293b] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-xl">
        
        {/* Title and stats */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold shrink-0">
            <Maximize2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white truncate max-w-xs sm:max-w-md">
                מצב קריאה וטלפרומפטר: {result.mainTitle}
              </h2>
              <span className="text-[10px] bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-semibold">
                ללא הסחות דעת
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>~{totalWords} מילים</span>
              <span>•</span>
              <span className="text-cyan-300 font-medium">זמן הקראה: {formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Teleprompter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Play/Pause Scroll */}
          <button
            onClick={() => setIsAutoScrolling((prev) => !prev)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
              isAutoScrolling
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
                : 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/20'
            }`}
          >
            {isAutoScrolling ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isAutoScrolling ? 'השהה גלילה (מקש רווח)' : 'הפעל גלילה אוטומטית'}</span>
          </button>

          {/* Reset Scroll */}
          <button
            onClick={() => {
              if (contentRef.current) contentRef.current.scrollTop = 0;
            }}
            className="p-2 text-slate-300 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-xl transition"
            title="חזור לראש התסריט"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Control */}
          <div className="flex items-center gap-1.5 bg-[#171b26] border border-[#2d3748] px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400">מהירות:</span>
            <button
              onClick={() => setScrollSpeed((s) => Math.max(1, s - 1))}
              className="p-0.5 hover:text-cyan-400 transition"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="font-bold text-cyan-300 min-w-[20px] text-center font-mono">
              {scrollSpeed}
            </span>
            <button
              onClick={() => setScrollSpeed((s) => Math.min(10, s + 1))}
              className="p-0.5 hover:text-cyan-400 transition"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Speech Rate WPM */}
          <div className="flex items-center gap-1.5 bg-[#171b26] border border-[#2d3748] px-3 py-1.5 rounded-xl text-xs">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={wpmSpeed}
              onChange={(e) => setWpmSpeed(Number(e.target.value))}
              className="bg-transparent text-slate-200 text-xs font-bold outline-none cursor-pointer"
            >
              <option value={110} className="bg-[#11141b] text-white">איטי (110 מ/דק')</option>
              <option value={140} className="bg-[#11141b] text-white">רגיל (140 מ/דק')</option>
              <option value={170} className="bg-[#11141b] text-white">מהיר (170 מ/דק')</option>
              <option value={200} className="bg-[#11141b] text-white">נמרץ (200 מ/דק')</option>
            </select>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-1 bg-[#171b26] border border-[#2d3748] p-1 rounded-xl">
            {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((sz) => (
              <button
                key={sz}
                onClick={() => setFontSize(sz)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  fontSize === sz
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sz.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 rounded-xl transition"
            title="סגור מצב קריאה (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Main Focus Reading Container */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto p-6 sm:p-12 md:p-20 space-y-12 max-w-5xl mx-auto w-full scroll-smooth select-text"
      >
        
        {/* Hook */}
        <div className="bg-[#0e1117]/80 border-r-4 border-red-500 p-6 sm:p-8 rounded-2xl space-y-3">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-red-500" />
            [HOOK - 10 שניות ראשונות]
          </span>
          <p className={`${getFontSizeClass()} text-white font-serif`}>
            {result.hookText}
          </p>
        </div>

        {/* Intro */}
        <div className="bg-[#0e1117]/50 border-r-4 border-cyan-500 p-6 sm:p-8 rounded-2xl space-y-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
            [INTRO - הקדמה]
          </span>
          <p className={`${getFontSizeClass()} text-slate-100`}>
            {result.introText}
          </p>
        </div>

        {/* Chapters */}
        <div className="space-y-12">
          {result.chapters.map((chapter, idx) => (
            <div
              key={idx}
              className="bg-[#0e1117] border border-[#1e293b] p-6 sm:p-10 rounded-3xl space-y-6 shadow-2xl hover:border-[#334155] transition"
            >
              <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
                <span className="text-sm font-mono font-bold text-cyan-400 bg-[#1e293b] px-3 py-1 rounded-xl border border-[#334155]">
                  {chapter.timestamp}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  פרק {idx + 1}: {chapter.title}
                </h3>
              </div>

              <div className={`${getFontSizeClass()} text-slate-100 whitespace-pre-line space-y-4`}>
                {chapter.scriptText}
              </div>

              {chapter.visualCue && (
                <div className="bg-[#172133] border border-[#2d3e5c] text-cyan-300 p-4 rounded-2xl text-base flex items-start gap-2">
                  <span className="font-bold text-cyan-400">🎥 הנחיה ויזואלית B-Roll:</span>
                  <span>{chapter.visualCue}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-[#0e1117]/80 border-r-4 border-emerald-500 p-6 sm:p-8 rounded-2xl space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            [CALL TO ACTION - הנעה לפעולה וסיום]
          </span>
          <p className={`${getFontSizeClass()} text-white`}>
            {result.ctaText}
          </p>
        </div>

      </div>

    </div>
  );
};
