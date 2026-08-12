import React, { useState } from 'react';
import { ChapterSegment } from '../types';
import { GripVertical, ArrowUp, ArrowDown, Plus, Trash2, Edit3, Clock, Film, Sparkles, Check } from 'lucide-react';

interface VisualScriptEditorProps {
  chapters: ChapterSegment[];
  onChangeChapters: (newChapters: ChapterSegment[]) => void;
}

export const VisualScriptEditor: React.FC<VisualScriptEditorProps> = ({
  chapters,
  onChangeChapters,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Re-calculate timestamps sequentially based on word counts (~140 words/min)
  const recalculateTimestamps = (chaps: ChapterSegment[]): ChapterSegment[] => {
    let cumulativeSeconds = 0;
    return chaps.map((ch) => {
      const mins = Math.floor(cumulativeSeconds / 60);
      const secs = cumulativeSeconds % 60;
      const formattedTs = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

      const words = ch.scriptText ? ch.scriptText.split(/\s+/).filter(Boolean).length : 0;
      const chSeconds = Math.max(15, Math.round((words / 140) * 60));
      cumulativeSeconds += chSeconds;

      return {
        ...ch,
        timestamp: formattedTs,
      };
    });
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...chapters];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setDraggedIndex(null);
    onChangeChapters(recalculateTimestamps(updated));
  };

  // Move up / down
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...chapters];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    onChangeChapters(recalculateTimestamps(updated));
  };

  const handleMoveDown = (index: number) => {
    if (index === chapters.length - 1) return;
    const updated = [...chapters];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    onChangeChapters(recalculateTimestamps(updated));
  };

  // Chapter editing
  const handleUpdateChapter = (index: number, field: keyof ChapterSegment, value: string) => {
    const updated = chapters.map((ch, i) => (i === index ? { ...ch, [field]: value } : ch));
    onChangeChapters(recalculateTimestamps(updated));
  };

  // Delete chapter
  const handleDeleteChapter = (index: number) => {
    if (chapters.length <= 1) {
      alert('התסריט חייב להכיל לפחות פרק אחד.');
      return;
    }
    if (confirm(`האם למחוק את פרק ${index + 1}?`)) {
      const updated = chapters.filter((_, i) => i !== index);
      onChangeChapters(recalculateTimestamps(updated));
    }
  };

  // Add new chapter
  const handleAddChapter = () => {
    const newCh: ChapterSegment = {
      timestamp: '00:00',
      title: `פרק ${chapters.length + 1}: נושא חדש`,
      summary: 'תקציר קצר של הנושא החדש...',
      scriptText: 'כאן נרשום את תסריט ההקראה עבור פרק זה...',
      visualCue: 'הצג כותרת על המסך + קטעי B-roll מתאימים',
    };
    const updated = [...chapters, newCh];
    onChangeChapters(recalculateTimestamps(updated));
    setEditingIndex(updated.length - 1);
  };

  return (
    <div className="space-y-6 dir-rtl text-right">
      
      {/* Visual Editor Header */}
      <div className="bg-[#11141b] border border-[#1e293b] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>עורך חזותי וסידור פרקים אינטראקטיבי (Drag & Drop Visual Editor)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            גרור והנח פרקים כדי לשנות את סדרם, ערוך את התוכן בלייב והזמנים יתעדכנו אוטומטית!
          </p>
        </div>

        <button
          onClick={handleAddChapter}
          className="px-4 py-2.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition flex items-center gap-2 shadow-lg shadow-cyan-900/30 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>הוסף פרק חדש לתסריט</span>
        </button>
      </div>

      {/* Chapters Cards List */}
      <div className="space-y-4">
        {chapters.map((chapter, idx) => {
          const isEditing = editingIndex === idx;
          const wordsCount = chapter.scriptText
            ? chapter.scriptText.split(/\s+/).filter(Boolean).length
            : 0;
          const isBeingDragged = draggedIndex === idx;

          return (
            <div
              key={idx}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              className={`bg-[#0a0c10] border rounded-2xl p-5 transition-all duration-200 ${
                isBeingDragged
                  ? 'border-cyan-500 opacity-50 scale-[0.98] shadow-2xl'
                  : 'border-[#1e293b] hover:border-[#334155]'
              }`}
            >
              {/* Card Header Toolbar */}
              <div className="flex items-center justify-between gap-3 border-b border-[#1e293b] pb-3 mb-4 flex-wrap">
                <div className="flex items-center gap-3">
                  {/* Drag Handle Icon */}
                  <div
                    className="p-1.5 text-slate-500 hover:text-cyan-400 cursor-grab active:cursor-grabbing rounded-lg hover:bg-[#1e293b] transition"
                    title="לחץ וגרור כדי לשנות מיקום"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Index Badge */}
                  <span className="text-xs font-black text-red-400 bg-red-600/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                    פרק #{idx + 1}
                  </span>

                  {/* Timestamp Pill */}
                  <span className="text-xs font-mono font-bold text-slate-300 bg-[#1e293b] px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-[#334155]">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{chapter.timestamp}</span>
                  </span>

                  <span className="text-xs text-slate-400 hidden sm:inline">
                    ({wordsCount} מילים • כ-{Math.round((wordsCount / 140) * 60)} שניות)
                  </span>
                </div>

                {/* Move & Action Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-[#1e293b] transition"
                    title="הזז למעלה"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === chapters.length - 1}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-[#1e293b] transition"
                    title="הזז למטה"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setEditingIndex(isEditing ? null : idx)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                      isEditing
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-[#1e293b] text-slate-200 hover:bg-[#334155]'
                    }`}
                  >
                    {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{isEditing ? 'סים עריכה' : 'ערוך פרק'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteChapter(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="מחק פרק"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editable Fields vs View Mode */}
              {isEditing ? (
                <div className="space-y-4 bg-[#11141b] p-4 rounded-xl border border-[#1e293b]">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1 block">כותרת הפרק:</label>
                    <input
                      type="text"
                      value={chapter.title}
                      onChange={(e) => handleUpdateChapter(idx, 'title', e.target.value)}
                      className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1 block">תמצית/סיכום הפרק:</label>
                    <input
                      type="text"
                      value={chapter.summary}
                      onChange={(e) => handleUpdateChapter(idx, 'summary', e.target.value)}
                      className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1 block">טקסט התסריט להקראה:</label>
                    <textarea
                      rows={4}
                      value={chapter.scriptText}
                      onChange={(e) => handleUpdateChapter(idx, 'scriptText', e.target.value)}
                      className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1">
                      <Film className="w-3.5 h-3.5" />
                      <span>הנחיה ויזואלית / B-Roll:</span>
                    </label>
                    <input
                      type="text"
                      value={chapter.visualCue || ''}
                      onChange={(e) => handleUpdateChapter(idx, 'visualCue', e.target.value)}
                      className="w-full bg-[#0a0c10] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-white">{chapter.title}</h4>
                  <p className="text-xs text-slate-400 font-medium">תמצית: {chapter.summary}</p>
                  <p className="text-xs text-slate-200 leading-relaxed bg-[#11141b] p-3 rounded-xl border border-[#1e293b]/60">
                    {chapter.scriptText}
                  </p>
                  {chapter.visualCue && (
                    <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span><strong>הנחיה ויזואלית:</strong> {chapter.visualCue}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
