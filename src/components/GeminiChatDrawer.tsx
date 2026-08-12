import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, User, Maximize2, Minimize2 } from 'lucide-react';
import { ChatMessage, SourceVideo, GeneratedResult } from '../types';

interface GeminiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isSending: boolean;
  sourceVideos: SourceVideo[];
  currentScript: GeneratedResult | null;
}

export const GeminiChatDrawer: React.FC<GeminiChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isSending,
  sourceVideos,
  currentScript,
}) => {
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    const text = inputText;
    setInputText('');
    await onSendMessage(text);
  };

  const quickPrompts = [
    'קצר את הפתיח (Hook) ב-30%',
    'הפוך את פרק 2 ליותר הומוריסטי',
    'הוסף הנחיות B-Roll מפורטות לכל פרק',
    'תרגם את כל התסריט לאנגלית',
    'צור 5 כותרות קצרות וקולעות ליוטיוב',
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 z-40 bg-[#0a0c10] border-t sm:border-r sm:border-t border-[#1e293b] shadow-2xl transition-all duration-300 flex flex-col dir-rtl text-right ${
        isExpanded
          ? 'w-full h-full sm:w-[600px] sm:h-[90vh] sm:rounded-tr-2xl'
          : 'w-full h-[520px] sm:w-[440px] sm:h-[600px] sm:rounded-tr-2xl'
      }`}
    >
      
      {/* Drawer Header */}
      <div className="p-4 bg-[#11141b] border-b border-[#1e293b] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">צ'אט AI עם ג'ימני</h3>
              <span className="text-[10px] bg-[#1e293b] text-cyan-400 border border-[#334155] px-2 py-0.5 rounded-full font-mono">
                gemini-3.6-flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {currentScript ? `פעיל על התסריט: "${currentScript.mainTitle.substring(0, 25)}..."` : `${sourceVideos.length} סרטוני מקור טעונים`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1e293b] transition hidden sm:block"
            title={isExpanded ? 'מזער' : 'הגדל'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1e293b] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-2 bg-[#0a0c10] border-b border-[#1e293b] flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(prompt)}
            disabled={isSending}
            className="text-[11px] text-slate-300 hover:text-cyan-300 bg-[#11141b] hover:bg-[#1e293b] px-2.5 py-1 rounded-full border border-[#1e293b] hover:border-[#334155] whitespace-nowrap transition shrink-0"
          >
            + {prompt}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 font-sans">
        {messages.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-500 space-y-2">
            <Bot className="w-8 h-8 mx-auto text-cyan-400/50" />
            <p className="text-xs font-medium text-slate-300">שאל את ג'ימני כל דבר לגבי הסרטון!</p>
            <p className="text-[11px] max-w-xs mx-auto text-slate-400">
              לדוגמה: "הפוך את הפתיח ליותר דרמטי", "תכתוב תיאור עם האשטגים ליוטיוב", "איזה נושא חסר בתסריט?"
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.sender === 'user'
                    ? 'bg-red-600 text-white'
                    : 'bg-[#1e293b] text-cyan-400 border border-[#334155]'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-red-600 text-white rounded-tl-none'
                    : 'bg-[#11141b] border border-[#1e293b] text-[#e2e8f0] rounded-tr-none whitespace-pre-wrap'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))
        )}

        {isSending && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs bg-[#11141b] border border-[#1e293b] p-3 rounded-2xl w-fit">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>ג'ימני מקליד תשובה...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleFormSubmit} className="p-3 bg-[#11141b] border-t border-[#1e293b] shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="רשום הודעה לג'ימני..."
            disabled={isSending}
            className="flex-1 bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold flex items-center justify-center shadow-lg shadow-red-900/20 transition disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

    </div>
  );
};
