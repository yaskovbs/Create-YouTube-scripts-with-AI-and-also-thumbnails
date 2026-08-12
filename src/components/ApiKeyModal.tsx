import React, { useState } from 'react';
import { X, Key, ShieldCheck, Check, AlertCircle, ExternalLink, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    status: 'none' | 'success' | 'error';
    message: string;
  }>({ status: 'none', message: '' });

  if (!isOpen) return null;

  const handleValidateKey = async () => {
    const keyToTest = inputKey.trim() || apiKey.trim();
    if (!keyToTest) {
      setValidationResult({
        status: 'error',
        message: 'אנא הזן מפתח API לבדיקת תקינות.',
      });
      return;
    }

    setIsValidating(true);
    setValidationResult({ status: 'none', message: '' });

    try {
      const res = await fetch('/api/gemini/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': keyToTest,
        },
        body: JSON.stringify({ apiKey: keyToTest }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setValidationResult({
          status: 'success',
          message: data.message || 'ה-API Key חוקי, פעיל ותקין מול מודל gemini-3.6-flash!',
        });
      } else {
        setValidationResult({
          status: 'error',
          message: data.error || 'ה-API Key אינו חוקי, פג תוקף או שאינו מורשה.',
        });
      }
    } catch (err: any) {
      setValidationResult({
        status: 'error',
        message: err.message || 'שגיאה בחיבור לשרת לצורך בדיקת המפתח.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(inputKey.trim());
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    setInputKey('');
    onSaveKey('');
    setValidationResult({ status: 'none', message: '' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0c10]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#11141b] border border-[#1e293b] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-white dir-rtl text-right">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#11141b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-cyan-400">
              <Key className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">ניהול ואבטחת Gemini API Key</h3>
              <p className="text-xs text-slate-400">הזן, אמת ואחסן את המפתח האישי שלך בבטחה</p>
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
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {/* Security details box */}
          <div className="bg-[#0a0c10] border border-[#1e293b] rounded-xl p-4 text-xs text-slate-300 leading-relaxed space-y-2">
            <div className="flex items-start gap-2 text-cyan-400 font-semibold">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-cyan-400" />
              <span>אחסון ואבטחה ברמה הגבוהה ביותר</span>
            </div>
            <p className="text-slate-300">
              מפתח ה-API נשמר <strong>מבוזר ומאובטח בדפדפן שלך בלבד (localStorage)</strong>.
              הוא נשלח אך ורק בבקשות שרת מוצפנות (HTTPS Headers) עבור פעולות היצירה והצ'אט, ואינו נשמר במסד נתונים או בקובצי שרת כלשהם.
            </p>
          </div>

          {/* How to get key instructions */}
          <div className="bg-[#1e293b]/50 border border-[#334155]/60 rounded-xl p-3 text-xs space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span>כיצד להשיק מפתח API בחינם מ-Google?</span>
            </div>
            <ol className="list-decimal list-inside text-slate-400 space-y-1 pr-1">
              <li>היכנס לאתר הרשמי Google AI Studio.</li>
              <li>לחץ על <strong>Create API key</strong> והעתק את המחרוזת.</li>
              <li>הדבק את המחרוזת בשדה למטה ולחץ על <strong>בדיקת תקינות</strong>.</li>
            </ol>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium text-xs pt-1 underline"
            >
              <span>להנפקת מפתח ב-Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Key Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Gemini API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setValidationResult({ status: 'none', message: '' });
                }}
                placeholder="AIzaSy..."
                className="flex-1 bg-[#0a0c10] border border-[#1e293b] rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={handleValidateKey}
                disabled={isValidating || (!inputKey.trim() && !apiKey.trim())}
                className="px-3 py-2 text-xs font-medium bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-cyan-400 rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>בודק...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>בדוק תקינות</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Validation Feedback */}
          {validationResult.status === 'success' && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{validationResult.message}</span>
            </div>
          )}

          {validationResult.status === 'error' && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{validationResult.message}</span>
            </div>
          )}

          {showSavedToast && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>המפתח נשמר בדפדפן בהצלחה!</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#1e293b]">
            {apiKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-lg hover:bg-rose-500/10 transition"
              >
                מחק מפתח שמור
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>פועל כרגע על מפתח המערכת</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[#1e293b] rounded-xl transition"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl shadow-lg shadow-red-900/20 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                שמור מפתח
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
