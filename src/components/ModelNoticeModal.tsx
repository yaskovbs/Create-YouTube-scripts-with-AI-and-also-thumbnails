import React from 'react';
import { X, Sparkles, CheckCircle2, Cpu } from 'lucide-react';

interface ModelNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelNoticeModal: React.FC<ModelNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0c10]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#11141b] border border-[#1e293b] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-white dir-rtl text-right">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#11141b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">הודעה לגבי מודל ה-AI</h3>
              <p className="text-xs text-slate-400">עדכון מודל Gemini באפליקציה</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-[#1e293b] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-[#0a0c10] border border-[#1e293b] rounded-xl p-4 text-xs text-slate-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-cyan-400">המודל הפעיל באפליקציה: gemini-3.6-flash</p>
              <p className="text-slate-300">
                האפליקציה מוגדרת להשתמש במודל <strong className="text-cyan-400 font-mono">gemini-3.6-flash</strong> הרשמי מבית Google עבור כל פעולות כתיבת התסריט, הניתוח והצ'אט.
              </p>
            </div>
          </div>

          <div className="bg-[#0a0c10] border border-[#1e293b] rounded-xl p-4 text-xs text-slate-300 leading-relaxed space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>למה gemini-3.6-flash הוא הבחירה המנצחת?</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 pr-1">
              <li>מהירות תגובה ויצירה פנומנלית בטקסטים ארוכים ובניתוח תמלילים.</li>
              <li>תמיכה מעולה ועשירה בשפה העברית ובניסוח תסריטי יוטיוב ויראליים.</li>
              <li>יכולת הבנה מקיפה של הקשר ממספר סרטוני מקור במקביל.</li>
              <li>אין צורך לעבור למודל אחר – המודל שנבחר מתאים ב-100% למשימה זו!</li>
            </ul>
          </div>

          <div className="pt-3 border-t border-[#1e293b] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl shadow-lg shadow-red-900/20 transition"
            >
              הבנתי, תודה!
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
