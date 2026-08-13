import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, X, ArrowLeft, Calendar } from 'lucide-react';
import { GeneratedResult } from '../types';

interface DeadlineNotificationManagerProps {
  result: GeneratedResult | null;
  onNavigateToScript?: () => void;
}

export const DeadlineNotificationManager: React.FC<DeadlineNotificationManagerProps> = ({
  result,
  onNavigateToScript,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [deadlineInfo, setDeadlineInfo] = useState<{
    scriptTitle: string;
    deadlineDate: Date;
    hoursLeft: number;
    minutesLeft: number;
    isOverdue: boolean;
    formattedTimeLeft: string;
  } | null>(null);

  useEffect(() => {
    // 1. Check if user already dismissed toast in current browser session
    const dismissedSession = sessionStorage.getItem('deadline_toast_dismissed');
    if (dismissedSession === 'true') {
      return;
    }

    // 2. Extract deadline from result or localStorage
    let targetResult = result;
    if (!targetResult) {
      try {
        const saved = localStorage.getItem('yt_script_last_result');
        if (saved) {
          targetResult = JSON.parse(saved);
        }
      } catch (err) {
        console.warn('Failed to parse saved script result for deadline check:', err);
      }
    }

    const deadlineStr = targetResult?.deadline;
    if (!deadlineStr) {
      setIsVisible(false);
      return;
    }

    const deadlineDate = new Date(deadlineStr);
    if (isNaN(deadlineDate.getTime())) {
      setIsVisible(false);
      return;
    }

    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hoursLeft = Math.floor(totalMinutes / 60);
    const minutesLeft = Math.abs(totalMinutes % 60);
    const isOverdue = diffMs < 0;

    // Check if deadline is within next 24 hours OR overdue
    // (within 24 hours = diffMs > 0 && hoursLeft <= 24, or overdue diffMs < 0)
    const isWithin24Hours = !isOverdue && hoursLeft <= 24;

    if (isWithin24Hours || isOverdue) {
      let formattedTimeLeft = '';
      if (isOverdue) {
        const overdueMins = Math.abs(totalMinutes);
        const overdueHours = Math.floor(overdueMins / 60);
        const remMins = overdueMins % 60;
        formattedTimeLeft = overdueHours > 0
          ? `איחור של ${overdueHours} שעות ו-${remMins} דקות`
          : `איחור של ${remMins} דקות`;
      } else {
        formattedTimeLeft = hoursLeft > 0
          ? `${hoursLeft} שעות ו-${minutesLeft} דקות`
          : `${minutesLeft} דקות`;
      }

      setDeadlineInfo({
        scriptTitle: targetResult?.mainTitle || 'תסריט יוטיוב',
        deadlineDate,
        hoursLeft,
        minutesLeft,
        isOverdue,
        formattedTimeLeft,
      });

      // Trigger toast visibility on app load with smooth slide-in
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 800);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [result]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('deadline_toast_dismissed', 'true');
  };

  const handleActionClick = () => {
    if (onNavigateToScript) {
      onNavigateToScript();
    } else {
      const el = document.getElementById('deadline-banner') || document.getElementById('result-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
    handleDismiss();
  };

  if (!isVisible || isDismissed || !deadlineInfo) {
    return null;
  }

  const { scriptTitle, deadlineDate, isOverdue, formattedTimeLeft } = deadlineInfo;

  return (
    <div
      className="fixed bottom-5 left-5 right-5 sm:left-auto sm:right-6 sm:max-w-md z-[9999] animate-slideUp transition-all duration-300"
      dir="rtl"
    >
      <div
        className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl relative overflow-hidden ${
          isOverdue
            ? 'bg-rose-950/95 border-rose-500/50 text-rose-100 shadow-rose-950/50'
            : 'bg-amber-950/95 border-amber-500/50 text-amber-100 shadow-amber-950/50'
        }`}
      >
        {/* Subtle accent bar */}
        <div
          className={`absolute top-0 right-0 left-0 h-1.5 ${
            isOverdue ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400 animate-pulse'
          }`}
        />

        <div className="flex items-start gap-3 pt-1">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isOverdue ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {isOverdue ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5 animate-bounce" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                {isOverdue ? '🚨 חריגה מתאריך יעד!' : '⚡ תזכורת: תאריך יעד ב-24 השעות הקרובות'}
              </span>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                title="סגור התראה"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-sm font-bold text-white truncate mt-0.5">
              "{scriptTitle}"
            </h4>

            <p className="text-xs text-slate-200 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                יעד לפרסום: <span className="font-mono font-bold text-white">{deadlineDate.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </span>
            </p>

            <div
              className={`mt-2.5 px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 border ${
                isOverdue
                  ? 'bg-rose-500/30 text-rose-200 border-rose-400/40'
                  : 'bg-amber-500/30 text-amber-200 border-amber-400/40'
              }`}
            >
              <span>{isOverdue ? 'חריגה מזמן היעד:' : 'זמן נותר:'}</span>
              <span className="font-mono text-white underline decoration-amber-400 font-extrabold">
                {formattedTimeLeft}
              </span>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleActionClick}
                className="px-3.5 py-1.5 bg-white text-slate-950 font-black text-xs rounded-xl shadow hover:bg-slate-200 transition flex items-center gap-1"
              >
                <span>צפה בתסריט</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-black/30 hover:bg-black/50 text-slate-300 text-xs rounded-xl transition"
              >
                הבנתי, תודה
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
