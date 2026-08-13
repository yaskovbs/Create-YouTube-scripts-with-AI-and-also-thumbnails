import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SourceVideosSection } from './components/SourceVideosSection';
import { ScriptOptionsForm } from './components/ScriptOptionsForm';
import { ScriptOutputView } from './components/ScriptOutputView';
import { GeminiChatDrawer } from './components/GeminiChatDrawer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ModelNoticeModal } from './components/ModelNoticeModal';
import { DeadlineNotificationManager } from './components/DeadlineNotificationManager';

import { SourceVideo, ScriptOptions, GeneratedResult, ChatMessage } from './types';
import { Sparkles, MessageSquare, AlertCircle, ArrowLeft, Youtube, FileText, CheckCircle2 } from 'lucide-react';

export default function App() {
  // State: Source Videos
  const [videos, setVideos] = useState<SourceVideo[]>([]);

  // State: Script Options
  const [options, setOptions] = useState<ScriptOptions>({
    targetDuration: 'standard',
    tone: 'engaging',
    targetAudience: 'חובבי יוטיוב ויוצרי תוכן',
    language: 'Hebrew',
    specialInstructions: '',
  });

  // State: Generation & Results
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedResult | null>(() => {
    try {
      const saved = localStorage.getItem('yt_script_last_result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // State: API Key
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_custom_api_key') || '';
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // State: Model Notice
  const [isModelNoticeOpen, setIsModelNoticeOpen] = useState(false);

  // State: Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatSending, setIsChatSending] = useState(false);

  // Save custom key to localStorage
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('gemini_custom_api_key', key);
    } else {
      localStorage.removeItem('gemini_custom_api_key');
    }
  };

  const handleClearSavedScript = () => {
    if (window.confirm('האם למחוק את התסריט השמור מ-localStorage?')) {
      setResult(null);
      localStorage.removeItem('yt_script_last_result');
    }
  };

  // Video Management
  const handleAddVideo = (video: SourceVideo) => {
    setVideos((prev) => [...prev, video]);
  };

  const handleUpdateVideo = (id: string, updated: Partial<SourceVideo>) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updated } : v))
    );
  };

  const handleRemoveVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const handleReset = () => {
    if (window.confirm('האם אתה בטוח שברצונך לאפס את כל הסרטונים והתסריט?')) {
      setVideos([]);
      setResult(null);
      setChatMessages([]);
      setGenerationError(null);
    }
  };

  // Script Generation API Call
  const handleGenerateScript = async () => {
    if (videos.length === 0) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey.trim()) {
        headers['x-gemini-api-key'] = apiKey.trim();
      }

      const res = await fetch('/api/gemini/synthesize', {
        method: 'POST',
        headers,
        body: JSON.stringify({ videos, options }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'שגיאה ביצירת התסריט');
      }

      setResult(data.result);
      try {
        localStorage.setItem('yt_script_last_result', JSON.stringify(data.result));
      } catch (err) {
        console.error('Failed to save script to localStorage:', err);
      }

      // Add welcoming message in chat
      setChatMessages([
        {
          id: `msg-${Date.now()}`,
          sender: 'ai',
          text: `שלום! התסריט שלך "${data.result.mainTitle}" נוצר בהצלחה עם ${data.result.chapters?.length || 0} פרקים! איך אוכל לעזור לשפר או להתאים אותו עבורך?`,
          timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Scroll smoothly down to result
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      setGenerationError(err.message || 'שגיאה ביצירת התסריט באמצעות AI');
    } finally {
      setIsGenerating(false);
    }
  };

  // Chat API Send
  const handleSendChatMessage = async (userText: string) => {
    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsChatSending(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey.trim()) {
        headers['x-gemini-api-key'] = apiKey.trim();
      }

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: chatMessages,
          sourceVideos: videos,
          currentScript: result,
          prompt: userText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'שגיאה בתקשורת עם הצ\'אט');
      }

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'ai',
          text: `שגיאה: ${err.message || 'לא ניתן לקבל תשובה כעת'}.`,
          timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleOpenChatWithPrompt = (promptText: string) => {
    setIsChatOpen(true);
    handleSendChatMessage(promptText);
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#e2e8f0] font-sans antialiased selection:bg-red-600 selection:text-white pb-24 flex flex-col justify-between">
      
      <div>
        {/* Header */}
        <Header
          hasCustomKey={!!apiKey.trim()}
          onOpenKeyModal={() => setIsKeyModalOpen(true)}
          onOpenModelNotice={() => setIsModelNoticeOpen(true)}
          onReset={handleReset}
          videoCount={videos.length}
        />

        {/* Main Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
          
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-3 dir-rtl">
            <div className="inline-flex items-center gap-2 bg-[#11141b] border border-[#1e293b] px-4 py-1.5 rounded-full text-xs font-semibold text-cyan-400">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <span>מנוע איחוד תסריטים ליוטיוב מבוסס AI - gemini-3.6-flash</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              קח כמה סרטוני יוטיוב,<br className="hidden sm:inline" />
              וצור תסריט מאוחד אחד <span className="text-red-500">מחולק לפרקים</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              טען סרטונים או הדבק תמלילים, הגדר את אורך הסרטון והטון המבוקש – וקבל תסריט מושלם להקראה, חלוקת טיים-סטאמפס אוטומטית ליוטיוב, הנחיות ויזואליות B-Roll וצ'אט AI להתאמה אישית.
            </p>
          </div>

          {/* 1. Source Videos Section */}
          <SourceVideosSection
            videos={videos}
            onAddVideo={handleAddVideo}
            onUpdateVideo={handleUpdateVideo}
            onRemoveVideo={handleRemoveVideo}
          />

          {/* 2. Script Options Section */}
          <ScriptOptionsForm
            options={options}
            onChangeOptions={(updated) => setOptions((prev) => ({ ...prev, ...updated }))}
            onGenerate={handleGenerateScript}
            isGenerating={isGenerating}
            videoCount={videos.length}
          />

          {/* Error Notification */}
          {generationError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex items-center gap-3 dir-rtl text-right">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="text-xs sm:text-sm">
                <strong className="font-bold block">שגיאה בתהליך היצירה:</strong>
                <span>{generationError}</span>
              </div>
            </div>
          )}

          {/* 3. Generated Result Output */}
          {result && (
            <section id="result-section" className="pt-4">
              <ScriptOutputView
                result={result}
                onOpenChatWithPrompt={handleOpenChatWithPrompt}
                onClearSavedScript={handleClearSavedScript}
                onSelectVersion={(selectedResult) => setResult(selectedResult)}
              />
            </section>
          )}

        </main>
      </div>

      {/* Footer System Bar from Design Theme */}
      <footer className="mt-16 h-10 bg-[#0a0c10] border-t border-[#1e293b] flex items-center px-6 text-[11px] text-slate-500 justify-between shrink-0 dir-rtl">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            מצב מערכת: תקין
          </span>
          <span className="hidden sm:inline">מנוע AI: Gemini-3.6-Flash</span>
        </div>
        <div className="flex items-center gap-4 dir-ltr">
          <span className="text-red-500 font-medium">YouTube API connected</span>
          <span className="text-cyan-400 font-mono">gemini-3.6-flash</span>
        </div>
      </footer>

      {/* Floating Chat Trigger Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-12 left-6 z-30 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold px-5 py-3.5 rounded-full shadow-2xl shadow-red-900/40 hover:scale-105 transition-all duration-300 flex items-center gap-2.5 text-xs sm:text-sm dir-rtl border border-red-500/30"
        >
          <div className="w-7 h-7 rounded-full bg-[#0a0c10] text-cyan-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-white font-bold">צ'אט AI עם ג'ימני</span>
          {result && (
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          )}
        </button>
      )}

      {/* Gemini Chat Drawer */}
      <GeminiChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendChatMessage}
        isSending={isChatSending}
        sourceVideos={videos}
        currentScript={result}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveApiKey}
      />

      {/* Model Notice Modal */}
      <ModelNoticeModal
        isOpen={isModelNoticeOpen}
        onClose={() => setIsModelNoticeOpen(false)}
      />

      {/* Deadline Toast Notification Manager */}
      <DeadlineNotificationManager result={result} />

    </div>
  );
}
