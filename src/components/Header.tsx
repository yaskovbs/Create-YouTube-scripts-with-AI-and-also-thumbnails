import React from 'react';
import { Youtube, Key, Sparkles, RefreshCw, FileCode, CheckCircle2, Info } from 'lucide-react';

interface HeaderProps {
  hasCustomKey: boolean;
  onOpenKeyModal: () => void;
  onOpenModelNotice: () => void;
  onLoadDemoData?: () => void;
  onReset: () => void;
  videoCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  hasCustomKey,
  onOpenKeyModal,
  onOpenModelNotice,
  onReset,
  videoCount,
}) => {
  return (
    <header className="bg-[#11141b] border-b border-[#1e293b] text-white sticky top-0 z-30 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/20 shrink-0">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                YouTube Script Master
              </h1>
              <div className="flex items-center gap-1.5 bg-[#1e293b] rounded-full px-2.5 py-0.5 border border-[#334155]">
                <span className="text-[11px] font-mono text-cyan-400 font-medium">gemini-3.6-flash</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              יוצר תסריט יוטיוב מאוחד מסרטוני מקור + חלוקה לפרקים וצ'אט AI
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Model info button */}
          <button
            onClick={onOpenModelNotice}
            className="flex items-center gap-1.5 text-xs bg-[#1e293b] hover:bg-[#334155] text-slate-300 px-3 py-1.5 rounded-md border border-[#334155] transition"
            title="פרטים על מודל ה-AI"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">מידע על gemini-3.6-flash</span>
          </button>

          {/* API Key Modal Button */}
          <button
            onClick={onOpenKeyModal}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition ${
              hasCustomKey
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-[#0a0c10] text-slate-300 border-[#334155] hover:border-cyan-500 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {hasCustomKey ? 'API Key אישי' : 'הגדר API Key'}
            </span>
            {hasCustomKey && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Reset */}
          {videoCount > 0 && (
            <button
              onClick={onReset}
              className="text-xs text-slate-400 hover:text-white p-2 rounded-md hover:bg-[#1e293b] transition"
              title="איפוס הכל"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
