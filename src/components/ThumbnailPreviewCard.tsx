import React, { useState, useRef } from 'react';
import { Download, Copy, Check, Sparkles, Image as ImageIcon, Edit3, Palette, FileImage } from 'lucide-react';
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      gradientColors: ['#3b0a0a', '#1a0505', '#0a0c10'],
      glowColor: 'rgba(239, 68, 68, 0.4)',
      accentGlow: 'bg-red-600/30',
      textColor: '#ffffff',
      badgeBg: '#ef4444',
      badgeText: '#ffffff',
      subColor: '#fca5a5',
      badgeClass: 'bg-red-600 text-white',
      taglineClass: 'text-red-400',
    },
    cyan: {
      bg: 'from-[#031520] via-[#083344] to-[#0a0c10]',
      gradientColors: ['#083344', '#031520', '#0a0c10'],
      glowColor: 'rgba(6, 182, 212, 0.4)',
      accentGlow: 'bg-cyan-500/30',
      textColor: '#cffaff',
      badgeBg: '#06b6d4',
      badgeText: '#020617',
      subColor: '#a5f3fc',
      badgeClass: 'bg-cyan-500 text-slate-950 font-black',
      taglineClass: 'text-cyan-400',
    },
    purple: {
      bg: 'from-[#150a21] via-[#2e1065] to-[#0a0c10]',
      gradientColors: ['#2e1065', '#150a21', '#0a0c10'],
      glowColor: 'rgba(147, 51, 234, 0.4)',
      accentGlow: 'bg-purple-600/30',
      textColor: '#ffffff',
      badgeBg: '#9333ea',
      badgeText: '#ffffff',
      subColor: '#e9d5ff',
      badgeClass: 'bg-purple-600 text-white',
      taglineClass: 'text-purple-300',
    },
    amber: {
      bg: 'from-[#1c1305] via-[#451a03] to-[#0a0c10]',
      gradientColors: ['#451a03', '#1c1305', '#0a0c10'],
      glowColor: 'rgba(245, 158, 11, 0.4)',
      accentGlow: 'bg-amber-500/30',
      textColor: '#fef3c7',
      badgeBg: '#f59e0b',
      badgeText: '#020617',
      subColor: '#fde68a',
      badgeClass: 'bg-amber-400 text-slate-950 font-black',
      taglineClass: 'text-amber-400',
    },
    dark: {
      bg: 'from-[#0f172a] via-[#1e293b] to-[#0a0c10]',
      gradientColors: ['#1e293b', '#0f172a', '#0a0c10'],
      glowColor: 'rgba(100, 116, 139, 0.4)',
      accentGlow: 'bg-[#334155]',
      textColor: '#ffffff',
      badgeBg: '#ffffff',
      badgeText: '#020617',
      subColor: '#cbd5e1',
      badgeClass: 'bg-white text-slate-950 font-black',
      taglineClass: 'text-slate-300',
    },
  };

  const currentTheme = themes[themeStyle];

  // Render to 1280x720 Canvas and Download PNG
  const handleDownloadPngImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw Background Linear Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1280, 720);
    bgGrad.addColorStop(0, currentTheme.gradientColors[0]);
    bgGrad.addColorStop(0.5, currentTheme.gradientColors[1]);
    bgGrad.addColorStop(1, currentTheme.gradientColors[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // 2. Glow Orbs
    const orb1 = ctx.createRadialGradient(250, 180, 10, 250, 180, 280);
    orb1.addColorStop(0, currentTheme.glowColor);
    orb1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = orb1;
    ctx.fillRect(0, 0, 1280, 720);

    const orb2 = ctx.createRadialGradient(1050, 520, 10, 1050, 520, 320);
    orb2.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
    orb2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = orb2;
    ctx.fillRect(0, 0, 1280, 720);

    // 3. Top Badge
    ctx.fillStyle = currentTheme.badgeBg;
    ctx.beginPath();
    ctx.roundRect(80, 60, 260, 54, 12);
    ctx.fill();

    ctx.fillStyle = currentTheme.badgeText;
    ctx.font = '900 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, 210, 96);

    // HD Resolution Tag
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(1100, 60, 110, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1280x720', 1155, 84);

    // 4. Main Overlay Title
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = currentTheme.textColor;
    ctx.font = '900 58px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';

    // Wrap main title text if long
    const words = overlayText.split(' ');
    let line = '';
    let y = 340;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 1050 && n > 0) {
        ctx.fillText(line, 640, y);
        line = words[n] + ' ';
        y += 70;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 640, y);

    // 5. Concept Subtitle
    ctx.shadowBlur = 10;
    ctx.fillStyle = currentTheme.subColor;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(`💡 ${currentTitleObj.thumbnailConcept.substring(0, 60)}`, 640, y + 65);

    // 6. Time Badge at bottom right
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.beginPath();
    ctx.roundRect(1120, 630, 100, 46, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(timeString, 1170, 662);

    // 7. Watermark
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('YouTube Script Master AI Studio', 80, 662);

    // Export & Download
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `YouTube_Thumbnail_${overlayText.substring(0, 15).replace(/\s+/g, '_')}.png`;
    a.click();
  };

  // Download SVG Representation as image
  const handleDownloadThumbnailSvg = () => {
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${currentTheme.gradientColors[0]}"/>
            <stop offset="50%" stop-color="${currentTheme.gradientColors[1]}"/>
            <stop offset="100%" stop-color="${currentTheme.gradientColors[2]}"/>
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
        
        <circle cx="250" cy="180" r="220" fill="${currentTheme.badgeBg}" opacity="0.3" filter="url(#glow)" />
        <circle cx="1050" cy="520" r="240" fill="#06b6d4" opacity="0.25" filter="url(#glow)" />

        <rect x="80" y="60" width="260" height="54" rx="12" fill="${currentTheme.badgeBg}" />
        <text x="210" y="96" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="${currentTheme.badgeText}" text-anchor="middle">
          ${badgeText.replace(/[^\w\u0590-\u05FF\s]/g, '')}
        </text>

        <text x="640" y="360" font-family="system-ui, sans-serif" font-size="58" font-weight="900" fill="${currentTheme.textColor}" text-anchor="middle" filter="url(#glow)">
          ${overlayText}
        </text>

        <text x="640" y="440" font-family="system-ui, sans-serif" font-size="26" font-weight="700" fill="${currentTheme.subColor}" text-anchor="middle">
          ${currentTitleObj.thumbnailConcept.substring(0, 50)}
        </text>

        <rect x="1120" y="630" width="100" height="46" rx="8" fill="#000000" opacity="0.85" />
        <text x="1170" y="662" font-family="monospace" font-size="22" font-weight="700" fill="#ffffff" text-anchor="middle">
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
      
      {/* Hidden HD Canvas for Rendering PNG Image */}
      <canvas ref={canvasRef} width={1280} height={720} className="hidden" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-red-500" />
            <span>מחולל ויוצר תמונת ממוזערת מועצם AI (YouTube Thumbnail Studio)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            עיצוב, התאמה אישית והורדת תמונה ברזולוציה מלאה (1280x720 HD) בלחיצה אחת
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleDownloadPngImage}
            className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-red-500 hover:bg-red-400 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-red-900/30"
            title="הורד תמונה מוכנה ברזולוציית Full HD 1280x720 PNG"
          >
            <FileImage className="w-4 h-4" />
            <span>הורד תמונה (1280x720 PNG)</span>
          </button>

          <button
            onClick={handleDownloadThumbnailSvg}
            className="px-3.5 py-2 text-xs font-bold text-slate-200 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-xl transition flex items-center gap-1.5"
            title="הורד כרזה בפורמט SVG וקטורי"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>SVG וקטורי</span>
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

      {/* Interactive 16:9 Thumbnail Visual Canvas Preview */}
      <div className="relative group rounded-2xl overflow-hidden border border-[#334155] shadow-2xl transition">
        <div
          className={`aspect-video w-full bg-gradient-to-br ${currentTheme.bg} p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden select-none`}
        >
          {/* Background Ambient Glow FX */}
          <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full ${currentTheme.accentGlow} blur-3xl opacity-60 pointer-events-none`} />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

          {/* Top Badge */}
          <div className="flex items-center justify-between z-10">
            <span className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-black shadow-lg uppercase tracking-wider ${currentTheme.badgeClass}`}>
              {badgeText}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-300 font-mono bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
              1280 x 720 HD
            </span>
          </div>

          {/* Center Title Content */}
          <div className="my-auto text-center space-y-2 z-10 px-2">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] leading-tight">
              {overlayText}
            </h2>
            <p className={`text-xs sm:text-sm md:text-base font-bold ${currentTheme.taglineClass} opacity-90 drop-shadow max-w-2xl mx-auto line-clamp-2`}>
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
              className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">תווית תגית עליונה (Badge):</label>
            <input
              type="text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="לדוגמה: חובה לצפות!"
              className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-bold"
            />
          </div>
        </div>

        {/* Color Palette Selector */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            ערכת צבעים וסגנון תמונה:
          </span>
          <div className="flex items-center gap-2">
            {[
              { id: 'red', label: 'אדום דרמטי', color: 'bg-red-600' },
              { id: 'cyan', label: 'ציאן טכנולוגי', color: 'bg-cyan-500' },
              { id: 'purple', label: 'סגול פרימיום', color: 'bg-purple-600' },
              { id: 'amber', label: 'זהב וחם', color: 'bg-amber-500' },
              { id: 'dark', label: 'שחור יוקרתי', color: 'bg-slate-700' },
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
