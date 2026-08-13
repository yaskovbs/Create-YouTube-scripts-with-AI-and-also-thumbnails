export interface SourceVideo {
  id: string;
  youtubeId?: string;
  url?: string;
  title: string;
  channel?: string;
  thumbnailUrl?: string;
  transcript: string;
  wordCount: number;
  sourceType: 'url' | 'paste' | 'demo';
}

export type TargetDuration = 'shorts' | 'short' | 'standard' | 'deep';
export type ScriptTone = 'engaging' | 'educational' | 'storytelling' | 'humorous' | 'analytical' | 'professional';

export type ChapterControlMode = 'auto' | 'exact_count' | 'chapter_length';
export type ChapterLengthRange = 'short_2_3' | 'medium_3_5' | 'long_6_10';

export interface ScriptOptions {
  targetDuration: TargetDuration;
  tone: ScriptTone;
  targetAudience: string;
  language: string;
  specialInstructions: string;
  chapterControlMode?: ChapterControlMode;
  chapterCount?: number;
  chapterLengthRange?: ChapterLengthRange;
  seriesMode?: boolean;
  customTargetWords?: number;
  customTargetMinutes?: number;
  deadline?: string;
}

export interface SeoTag {
  tag: string;
  category?: 'High Volume' | 'Long-tail' | 'Trending' | 'Brand';
  relevanceScore?: number;
}

export interface EmotionalPoint {
  chapterIndex: number;
  chapterTitle: string;
  emotionalScore: number; // 0-100
  emotionLabel: string;
  pacingNote: string;
}

export interface ScriptChapter {
  timestamp: string; // e.g. "00:00"
  title: string;
  summary: string;
  scriptText: string;
  visualCue: string;
  speakerNote?: string;
}

export type ChapterSegment = ScriptChapter;

export interface TitleOption {
  title: string;
  hookAngle: string;
  thumbnailConcept: string;
}

export interface GeneratedResult {
  mainTitle: string;
  titles: TitleOption[];
  hookText: string;
  introText: string;
  chapters: ScriptChapter[];
  fullScriptMarkdown: string;
  ctaText: string;
  youtubeDescription: string;
  hashtags: string[];
  seoTags?: (SeoTag | string)[];
  emotionalCurve?: EmotionalPoint[];
  thumbnailPlaceholderUrl?: string;
  generatedAt: string;
  deadline?: string;
}

export interface ScriptVersion {
  id: string;
  versionName: string;
  createdAt: string;
  result: GeneratedResult;
  optionsSummary: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface UserApiKeyConfig {
  apiKey: string;
  isCustomKeySet: boolean;
}
