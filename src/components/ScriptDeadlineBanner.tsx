import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, Bell, Edit3, X, Sparkles, Plus, AlertCircle } from 'lucide-react';

interface ScriptDeadlineBannerProps {
  deadline?: string;
  onUpdateDeadline: (newDeadline: string | undefined) => void;
}

export const ScriptDeadlineBanner: React.FC<ScriptDeadlineBannerProps> = ({
  deadline,
  onUpdateDeadline,
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(deadline || '');

  // Live timer tick every second for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync internal input value if deadline prop changes
  useEffect(() => {
    setInputValue(deadline || '');
  }, [deadline]);

  // Helper to format ISO date to datetime-local input string format YYYY-MM-DDTHH:mm
  const toLocalDatetimeString = (date: Date): string => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const mins = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  // Preset Handlers
  const handleSetPreset = (daysToAdd: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysToAdd);
    target.setHours(18, 0, 0, 0); // Default to 18:00 evening publishing
    const formatted = toLocalDatetimeString(target);
    setInputValue(formatted);
    onUpdateDeadline(formatted);
    setIsEditing(false);
  };

  const handleSaveInput = () => {
    if (!inputValue) {
      onUpdateDeadline(undefined);
    } else {
      onUpdateDeadline(inputValue);
    }
    setIsEditing(false);
  };

  const handleClear = () => {
    setInputValue('');
    onUpdateDeadline(undefined);
    setIsEditing(false);
  };

  if (!deadline && !isEditing) {
    return (
      <div className="bg-[#11141b] border border-[#1e293b] hover:border-[#334155] rounded-2xl p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 dir-rtl text-right">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>תאריך יעד לפרסום ביוטיוב (Publishing Deadline)</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
                לא הוגדר
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              הגדר תאריך ושעה לפרסום הסרטון כדי לקבל התראות תזכורת וספירה לאחור בזמן אמת.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => handleSetPreset(3)}
            className="px-3 py-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl hover:bg-amber-500/20 transition flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>בעוד 3 ימים</span>
          </button>

          <button
            onClick={() => setIsEditing(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>הגדר תאריך יעד</span>
          </button>
        </div>
      </div>
    );
  }

  // Edit Mode UI
  if (isEditing) {
    return (
      <div className="bg-[#11141b] border border-amber-500/40 rounded-2xl p-4 space-y-3 dir-rtl text-right">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>קביעת תאריך ושעת יעד לפרסום הסרטון</span>
          </span>
          <button
            onClick={() => setIsEditing(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="datetime-local"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
          />

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleSetPreset(1)}
              className="px-2.5 py-1.5 text-[11px] font-bold text-slate-300 bg-[#1e293b] hover:bg-[#334155] rounded-lg transition"
            >
              מחר (24 שעות)
            </button>
            <button
              onClick={() => handleSetPreset(3)}
              className="px-2.5 py-1.5 text-[11px] font-bold text-slate-300 bg-[#1e293b] hover:bg-[#334155] rounded-lg transition"
            >
              בעוד 3 ימים
            </button>
            <button
              onClick={() => handleSetPreset(7)}
              className="px-2.5 py-1.5 text-[11px] font-bold text-slate-300 bg-[#1e293b] hover:bg-[#334155] rounded-lg transition"
            >
              בעוד שבוע
            </button>
          </div>

          <div className="flex items-center gap-2 mr-auto pt-2 sm:pt-0">
            <button
              onClick={handleSaveInput}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition"
            >
              שמור תאריך יעד
            </button>
            {deadline && (
              <button
                onClick={handleClear}
                className="px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
              >
                בטל תאריך
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active Deadline Calculations
  const deadlineDate = new Date(deadline!);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const isOverdue = diffMs < 0;

  const absDiff = Math.abs(diffMs);
  const totalSeconds = Math.floor(absDiff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = !isOverdue && diffMs < 24 * 3600 * 1000; // < 24 hours
  const isApproaching = !isOverdue && !isUrgent && diffMs < 72 * 3600 * 1000; // < 3 days

  const formattedDeadlineDate = deadlineDate.toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedDeadlineTime = deadlineDate.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-300 dir-rtl text-right shadow-xl ${
        isOverdue
          ? 'bg-rose-950/80 border-rose-500 text-rose-100 shadow-rose-950/50'
          : isUrgent
          ? 'bg-amber-950/80 border-amber-500 text-amber-100 shadow-amber-950/50 ring-1 ring-amber-500/30'
          : isApproaching
          ? 'bg-[#11141b] border-amber-500/40 text-slate-100'
          : 'bg-[#11141b] border-cyan-500/40 text-slate-100'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Side: Status & Message */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              isOverdue
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-bounce'
                : isUrgent
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse'
                : 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
            }`}
          >
            {isOverdue ? (
              <AlertTriangle className="w-6 h-6" />
            ) : isUrgent ? (
              <Bell className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black">
                {isOverdue
                  ? '🚨 התראת דחיפות: חריגה מתאריך היעד לפרסום!'
                  : isUrgent
                  ? '⚡ התראה: מועד הפרסום ביוטיוב מתקרב מאוד!'
                  : '📅 מועד פרסום מתוכנן ביוטיוב'}
              </span>

              {/* Status Badge */}
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isOverdue
                    ? 'bg-rose-500 text-slate-950 border-rose-400 font-black'
                    : isUrgent
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                }`}
              >
                {isOverdue
                  ? 'איחור בלוח הזמנים'
                  : isUrgent
                  ? 'דחוק (פחות מ-24 שעות)'
                  : 'בזמן למטרה'}
              </span>
            </div>

            <p className="text-xs opacity-90 leading-relaxed">
              תאריך יעד: <strong>{formattedDeadlineDate}</strong> בשעה <strong>{formattedDeadlineTime}</strong>
            </p>

            {isOverdue && (
              <p className="text-xs text-rose-300 font-bold flex items-center gap-1 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>עברו {days} ימים, {hours} שעות ו-{minutes} דקות ממועד הפרסום! מומלץ לסיים ולהעלות את הסרטון בהקדם.</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Live Countdown Timer Display & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 self-end md:self-center">
          
          {/* Live Countdown Grid */}
          <div className="flex items-center gap-1.5 font-mono">
            {days > 0 && (
              <div className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-center min-w-[50px]">
                <div className="text-base font-black text-white">{days}</div>
                <div className="text-[9px] text-slate-400 uppercase">ימים</div>
              </div>
            )}

            <div className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-center min-w-[50px]">
              <div className="text-base font-black text-white">{hours < 10 ? `0${hours}` : hours}</div>
              <div className="text-[9px] text-slate-400 uppercase">שעות</div>
            </div>

            <div className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-center min-w-[50px]">
              <div className="text-base font-black text-white">{minutes < 10 ? `0${minutes}` : minutes}</div>
              <div className="text-[9px] text-slate-400 uppercase">דקות</div>
            </div>

            <div className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-center min-w-[50px]">
              <div className="text-base font-black text-amber-400">{seconds < 10 ? `0${seconds}` : seconds}</div>
              <div className="text-[9px] text-slate-400 uppercase">שניות</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleSetPreset(1)}
              className="px-2.5 py-1.5 text-[11px] font-bold bg-black/40 hover:bg-black/70 border border-white/10 rounded-xl transition"
              title="הארך/דחה ב-24 שעות נוספות"
            >
              +24 ש'
            </button>

            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-slate-300 hover:text-white bg-black/40 hover:bg-black/70 border border-white/10 rounded-xl transition"
              title="ערוך תאריך יעד"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={handleClear}
              className="p-2 text-rose-300 hover:text-rose-100 bg-black/40 hover:bg-rose-900/40 border border-white/10 rounded-xl transition"
              title="מחק תאריך יעד"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
