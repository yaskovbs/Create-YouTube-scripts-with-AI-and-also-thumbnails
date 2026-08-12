import React, { useState } from 'react';
import { Youtube, Plus, Trash2, Edit3, Loader2, Sparkles, FileText, CheckCircle2, AlertCircle, Link2, ExternalLink } from 'lucide-react';
import { SourceVideo } from '../types';

interface SourceVideosSectionProps {
  videos: SourceVideo[];
  onAddVideo: (video: SourceVideo) => void;
  onUpdateVideo: (id: string, updated: Partial<SourceVideo>) => void;
  onRemoveVideo: (id: string) => void;
  onLoadDemo?: () => void;
}

export const SourceVideosSection: React.FC<SourceVideosSectionProps> = ({
  videos,
  onAddVideo,
  onUpdateVideo,
  onRemoveVideo,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Manual paste toggle
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualChannel, setManualChannel] = useState('');
  const [manualTranscript, setManualTranscript] = useState('');

  // Editing existing video transcript modal
  const [editingVideo, setEditingVideo] = useState<SourceVideo | null>(null);
  const [editingTranscriptText, setEditingTranscriptText] = useState('');

  const handleFetchUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsLoadingUrl(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const customKey = localStorage.getItem('gemini_custom_api_key') || '';

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customKey) {
        headers['x-gemini-api-key'] = customKey;
      }

      const res = await fetch('/api/youtube/fetch', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'שגיאה בפענוח סרטון היוטיוב');
      }

      const newVideo: SourceVideo = {
        id: `yt-${Date.now()}`,
        youtubeId: data.youtubeId,
        url: data.url,
        title: data.title || 'סרטון יוטיוב ללא שם',
        channel: data.channel || 'ערוץ יוטיוב',
        thumbnailUrl: data.thumbnailUrl || `https://img.youtube.com/vi/${data.youtubeId}/hqdefault.jpg`,
        transcript: data.transcript || '',
        wordCount: data.wordCount || 0,
        sourceType: 'url',
      };

      onAddVideo(newVideo);
      setUrlInput('');
      setSuccessMessage(`הסרטון "${newVideo.title}" והתמליל שלו חולצו בהצלחה (${newVideo.wordCount} מילים)!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'שגיאה בחיבור ליוטיוב. נסה להדביק את תמליל הטקסט ידנית.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTranscript.trim()) return;

    const newVideo: SourceVideo = {
      id: `manual-${Date.now()}`,
      title: manualTitle.trim() || `סרטון / תמליל מקור #${videos.length + 1}`,
      channel: manualChannel.trim() || 'טקסט שהודבק ידנית',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      transcript: manualTranscript.trim(),
      wordCount: manualTranscript.trim().split(/\s+/).length,
      sourceType: 'paste',
    };

    onAddVideo(newVideo);
    setManualTitle('');
    setManualChannel('');
    setManualTranscript('');
    setShowManualPaste(false);
  };

  const handleSaveEditTranscript = () => {
    if (editingVideo) {
      const text = editingTranscriptText.trim();
      onUpdateVideo(editingVideo.id, {
        transcript: text,
        wordCount: text ? text.split(/\s+/).length : 0,
      });
      setEditingVideo(null);
      setEditingTranscriptText('');
    }
  };

  const totalWords = videos.reduce((acc, v) => acc + (v.wordCount || 0), 0);

  return (
    <div className="space-y-6 dir-rtl text-right">
      
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#11141b] border border-[#1e293b] p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Youtube className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">1. איסוף סרטוני המקור</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            הכנס קישורים לסרטוני יוטיוב או הדבק תמלילים/טקסטים שברצונך לשלב לתסריט אחד חדש.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#0a0c10] border border-[#1e293b] px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>{videos.length} סרטונים</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-medium">{totalWords.toLocaleString()} מילים סה"כ</span>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-[#11141b] border border-[#1e293b] rounded-2xl p-5 shadow-lg space-y-4">
        
        {/* Toggle between URL input and Paste Text */}
        <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
          <button
            type="button"
            onClick={() => setShowManualPaste(false)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              !showManualPaste
                ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>הוסף קישור יוטיוב</span>
          </button>
          <button
            type="button"
            onClick={() => setShowManualPaste(true)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              showManualPaste
                ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>הדבק תמליל/טקסט ידנית</span>
          </button>
        </div>

        {/* URL Form */}
        {!showManualPaste ? (
          <form onSubmit={handleFetchUrl} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 ltr text-left"
              />
            </div>
            <button
              type="submit"
              disabled={isLoadingUrl || !urlInput.trim()}
              className="px-5 py-3 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl shadow-lg shadow-red-900/20 transition disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
            >
              {isLoadingUrl ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>מחלץ סרטון וכתוביות...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>ייבא סרטון</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Manual Paste Form */
          <form onSubmit={handleAddManual} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="שם הסרטון / הנושא (אופציונלי)"
                className="bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                value={manualChannel}
                onChange={(e) => setManualChannel(e.target.value)}
                placeholder="שם הערוץ / המקור (אופציונלי)"
                className="bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <textarea
              rows={4}
              value={manualTranscript}
              onChange={(e) => setManualTranscript(e.target.value)}
              placeholder="הדבק כאן את תמליל הדיבור, הכתוביות או הסיכום של הסרטון..."
              className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!manualTranscript.trim()}
                className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl shadow-lg shadow-red-900/20 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף תמליל לרשימה</span>
              </button>
            </div>
          </form>
        )}

        {errorMessage && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

      </div>

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <div className="border border-dashed border-[#1e293b] rounded-2xl p-8 text-center bg-[#11141b]/50">
          <Youtube className="w-10 h-10 text-red-500/50 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300 mb-1">עדיין לא הוספת סרטוני מקור</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            הדבק קישור לסרטון יוטיוב בתיבה למעלה - המערכת תחלץ אוטומטית את התמליל והתוכן מהסרטון ותוסיף אותו לרשימת המקורות.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video, idx) => (
            <div
              key={video.id}
              className="bg-[#11141b] border border-[#1e293b] rounded-2xl overflow-hidden shadow-lg hover:border-[#334155] transition flex flex-col justify-between group"
            >
              <div>
                {/* Thumbnail Header */}
                <div className="relative aspect-video bg-[#0a0c10] overflow-hidden">
                  <img
                    src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/20 to-transparent" />
                  
                  <span className="absolute top-2 right-2 bg-[#0a0c10]/80 backdrop-blur-md text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#1e293b]">
                    #{idx + 1}
                  </span>

                  {video.url && (
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-2 left-2 bg-[#0a0c10]/80 backdrop-blur-md text-slate-300 hover:text-white p-1 rounded-full border border-[#1e293b] transition"
                      title="פתח ביוטיוב"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <div className="absolute bottom-2 right-2 left-2">
                    <span className="text-[11px] text-red-300 font-medium block truncate">
                      {video.channel || 'ערוץ יוטיוב'}
                    </span>
                    <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                      {video.title}
                    </h3>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-500" />
                      {video.wordCount ? `${video.wordCount.toLocaleString()} מילים` : 'חלק מהתמליל'}
                    </span>
                    {video.transcript ? (
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-medium text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> תמליל טעון
                      </span>
                    ) : (
                      <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-medium text-[10px]">
                        חֶסֶר תמליל
                      </span>
                    )}
                  </div>

                  {/* Transcript snippet */}
                  <div className="bg-[#0a0c10] rounded-xl p-2.5 border border-[#1e293b] text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                    {video.transcript ? video.transcript : 'אין תמליל טעון לסרטון זה. לחץ על כפתור העריכה כדי להדביק.'}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-4 py-3 bg-[#0a0c10]/60 border-t border-[#1e293b] flex items-center justify-between">
                <button
                  onClick={() => {
                    setEditingVideo(video);
                    setEditingTranscriptText(video.transcript);
                  }}
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[#1e293b] transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>ערוך תמליל</span>
                </button>

                <button
                  onClick={() => onRemoveVideo(video.id)}
                  className="text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                  title="הסר סרטון"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Edit Transcript Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 bg-[#0a0c10]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11141b] border border-[#1e293b] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-white dir-rtl text-right">
            <div className="p-5 border-b border-[#1e293b] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">עריכת תמליל: {editingVideo.title}</h3>
                <p className="text-xs text-slate-400">ערוך או הדבק את הדיבור מהסרטון במלואו</p>
              </div>
              <button
                onClick={() => setEditingVideo(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1e293b]"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <textarea
                rows={10}
                value={editingTranscriptText}
                onChange={(e) => setEditingTranscriptText(e.target.value)}
                placeholder="הדבק כאן את תמליל הסרטון..."
                className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
              />

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{editingTranscriptText.split(/\s+/).filter(Boolean).length} מילים</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingVideo(null)}
                    className="px-4 py-2 rounded-xl text-slate-300 hover:bg-[#1e293b]"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleSaveEditTranscript}
                    className="px-5 py-2 font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl shadow-lg shadow-red-900/20"
                  >
                    שמור תמליל
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
