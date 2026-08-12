import React, { useState } from 'react';
import { Download, Copy, Check, Sparkles, Image as ImageIcon, Edit3, Palette, Eye } from 'lucide-react';
import { GeneratedResult } from '../types';

interface ThumbnailPreviewCardProps {
  result: GeneratedResult;
  selectedTitleIndex?: number;
  onSelectTitleIndex?: (index: number) => void;
}

export const ThumbnailPreviewCard: React.FC<ThumbnailPreviewCardProps> = ({
  result,
  selectedTitleIndex = 0,
}) => {
  const currentTitleObj = result.titles?.[selectedTitleIndex] || result.titles?.[0] || {
    title: result.mainTitle,
    hookAngle: 'זווית שיווקית חזקה',
    thumbnailConcept: 'תמונה דרמטית עם קונטרסט גבוה וטקסט בולט',
  };

  const [overlayText, setOverlayText] = useState<string>(
    currentTitleObj.title.length > 35
      ? currentTitleObj.title.substring(0, 32) + '...'
      : currentTitleObj.title
  );

  const [badgeText, setBadgeText] = useState<string>('חובה לצפות 🔥');
  const [themeStyle, setThemeStyle] = useState<'red' | 'cyan' | 'purple' | 'amber' | 'dark'>('red');
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedImagePrompt, setCopiedImagePrompt] = useState<boolean>(false);

  // Derive estimated duration display
  const totalWords = (result.chapters || []).reduce(
    (acc, c) => acc + (c.scriptText ? c.scriptText.split(/\s+/).filter(Boolean).length : 0),
    0
  );
  const totalMins = Math.max(1, Math.round(totalWords / 140));
  const timeString = `${totalMins < 10 ? '0' : ''}${totalMins}:30`;

  // Midjourney / DALL-E Prompt builder
  const buildAiImagePrompt = () => {
    return `A high-click-through-rate YouTube video thumbnail, 16:9 ratio, ultra high contrast, dramatic lighting, bold 3D typography in center saying "${overlayText}", background concept: ${currentTitleObj.thumbnailConcept}, cinematic, vivid colors, trending on YouTube Studio 2026 --ar 16:9 --style raw --v 6.0`;
  };

  const handleCopyAiPrompt = () => {
    navigator.clipboard.writeText(buildAiImagePrompt());
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const themes = {
    red: {
      bg: 'from-[#1a0505] via-[#3b0a0a] to-[#0a0c10]',
      border: 'border-red-500/40',
      accentGlow: 'bg-red-600/30',
      textColor: 'text-white',
      badgeBg: 'bg-red-600 text-white',
      taglineColor: 'text-red-400',
    },
    cyan: {
      bg: 'from-[#031520] via-[#083344] to-[#0a0c10]',
      border: 'border-cyan-500/40',
      accentGlow: 'bg-cyan-500/30',
      textColor: 'text-cyan-100',
      badgeBg: 'bg-cyan-500 text-slate-950 font-black',
      taglineColor: 'text-cyan-400',
    },
    purple: {
      bg: 'from-[#150a21] via-[#2e1065] to-[#0a0c10]',
      border: 'border-purple-500/40',
      accentGlow: 'bg-purple-600/30',
      textColor: 'text-white',
      badgeBg: 'bg-purple-600 text-white',
      taglineColor: 'text-purple-300',
    },
    amber: {
      bg: 'from-[#1c1305] via-[#451a03] to-[#0a0c10]',
      border: 'border-amber-500/40',
      accentGlow: 'bg-amber-500/30',
      textColor: 'text-amber-100',
      badgeBg: 'bg-amber-400 text-slate-950 font-black',
      taglineColor: 'text-amber-400',
    },
    dark: {
      bg: 'from-[#0f172a] via-[#1e293b] to-[#0a0c10]',
      border: 'border-slate-500/40',
      accentGlow: 'bg-[#334155]',
      textColor: 'text-white',
      badgeBg: 'bg-white text-slate-950 font-black',
      taglineColor: 'text-slate-300',
    },
  };

  const currentTheme = themes[themeStyle];

  // Download SVG Representation as image
  const handleDownloadThumbnailSvg = () => {
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b"/>
            <stop offset="50%" stop-color="#7f1d1d"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="1280" height="720" fill="url(#bgGrad)"/>
        
        <!-- Decorative Glow Circles -->
        <circle cx="200" cy="150" r="180" fill="#ef4444" opacity="0.35" filter="url(#glow)" />
        <circle cx="1080" cy="550" r="220" fill="#06b6d4" opacity="0.25" filter="url(#glow)" />

        <!-- Badge -->
        <rect x="80" y="70" width="280" height="54" rx="12" fill="#ef4444" />
        <text x="220" y="106" font-family="system-ui, sans-serif" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle">
          ${badgeText.replace(/[^\w\u0590-\u05FF\s]/g, '')}
        </text>

        <!-- Main Title Text -->
        <text x="640" y="380" font-family="system-ui, sans-serif" font-size="62" font-weight="900" fill="#ffffff" text-anchor="middle" filter="url(#glow)">
          ${overlayText}
        </text>

        <!-- Concept Subtitle -->
        <text x="640" y="460" font-family="system-ui, sans-serif" font-size="28" font-weight="600" fill="#fca5a5" text-anchor="middle">
          ${currentTitleObj.thumbnailConcept.substring(0, 50)}
        </text>

        <!-- Time Badge -->
        <rect x="1130" y="630" width="100" height="46" rx="8" fill="#000000" opacity="0.85" />
        <text x="1180" y="662" font-family="monospace" font-size="22" font-weight="700" fill="#ffffff" text-anchor="middle">
          ${timeString}
        </text>
      </svg>
    `;

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `YouTube_Thumbnail_${overlayText.substring(0, 15).replace(/\s+/g, '_')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#0a0c10] border border-[#1e293b] rounded-2xl p-6 space-y-6 dir-rtl text-right">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-red-500" />
            <span>כרזת תמונת ממוזערת מומלצת (YouTube Thumbnail Reference)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            תצוגה ויזואלית מקדימה בגודל תקני 16:9 להורדה ולשימוש כהשראה / רפרנס לקנבה וג'נרטורים
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleDownloadThumbnailSvg}
            className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-red-500 hover:bg-red-400 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-red-900/30"
            title="הורד תמונה ויזואלית בפורמט SVG"
          >
            <Download className="w-4 h-4" />
            <span>הורד כרזה (.SVG)</span>
          </button>

          <button
            onClick={handleCopyAiPrompt}
            className="px-3.5 py-2 text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition flex items-center gap-1.5"
            title="העתק פרומפט מוכן לייצור תמונה ב-Midjourney / DALL-E"
          >
            {copiedPrompt ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4 text-cyan-400" />}
            <span>{copiedPrompt ? 'פרומפט הועתק!' : 'העתק Prompt ל-Midjourney'}</span>
          </button>
        </div>
      </div>

      {/* Interactive 16:9 Thumbnail Visual Canvas */}
      <div className="relative group rounded-2xl overflow-hidden border border-[#334155] shadow-2xl transition">
        <div
          className={`aspect-video w-full bg-gradient-to-br ${currentTheme.bg} p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden select-none`}
        >
          {/* Background Ambient Glow FX */}
          <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full ${currentTheme.accentGlow} blur-3xl opacity-60 pointer-events-none`} />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

          {/* Top Badge */}
          <div className="flex items-center justify-between z-10">
            <span className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-black shadow-lg uppercase tracking-wider ${currentTheme.badgeBg}`}>
              {badgeText}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-300 font-mono bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
              1280 x 720 HD
            </span>
          </div>

          {/* Center Title Content */}
          <div className="my-auto text-center space-y-2 z-10 px-2">
            <h2 className={`text-2xl sm:text-4xl md:text-5xl font-black ${currentTheme.textColor} drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-tight`}>
              {overlayText}
            </h2>
            <p className={`text-xs sm:text-sm md:text-base font-bold ${currentTheme.taglineColor} opacity-90 drop-shadow max-w-2xl mx-auto line-clamp-2`}>
              💡 {currentTitleObj.thumbnailConcept}
            </p>
          </div>

          {/* Bottom Time Overlay */}
          <div className="flex items-center justify-between z-10 text-xs">
            <span className="text-[11px] text-slate-300/80 bg-black/40 px-2.5 py-0.5 rounded-md backdrop-blur-sm">
              YouTube Master AI Concept
            </span>
            <span className="font-mono font-bold text-white bg-black/90 px-2 py-0.5 rounded border border-white/20 text-xs">
              {timeString}
            </span>
          </div>
        </div>
      </div>

      {/* Thumbnail Controls & Text Customizer */}
      <div className="bg-[#11141b] border border-[#1e293b] rounded-xl p-4 space-y-4">
        <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>התאמה אישית של טקסט הכרזה וסגנון:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">טקסט ראשי על גבי התמונה:</label>
            <input
              type="text"
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="רשום טקסט קצר ובולט לכרזה..."
              className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">תווית תגית עליונה (Badge):</label>
            <input
              type="text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="לדוגמה: חובה לצפות!"
              className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Color Palette Selector */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            ערכת צבעים:
          </span>
          <div className="flex items-center gap-2">
            {[
              { id: 'red', label: 'אדום', color: 'bg-red-600' },
              { id: 'cyan', label: 'ציאן', color: 'bg-cyan-500' },
              { id: 'purple', label: 'סגול', color: 'bg-purple-600' },
              { id: 'amber', label: 'אמבר', color: 'bg-amber-500' },
              { id: 'dark', label: 'כהה', color: 'bg-slate-700' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setThemeStyle(st.id as any)}
                className={`w-6 h-6 rounded-full ${st.color} transition transform ${
                  themeStyle === st.id ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                }`}
                title={st.label}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
