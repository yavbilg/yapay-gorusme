export type Emotion = 'angry' | 'disgusted' | 'fearful' | 'happy' | 'sad' | 'surprised' | 'neutral';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface EmotionRecord {
  emotion: Emotion;
  timestamp: number;
}

export type InterviewStatus = 'idle' | 'starting' | 'speaking' | 'listening' | 'processing' | 'ended' | 'reporting';

export const EMOTION_LABELS: Record<Emotion, string> = {
  angry: 'Kizgin',
  disgusted: 'Igrenme',
  fearful: 'Korkulu',
  happy: 'Mutlu',
  sad: 'Uzgun',
  surprised: 'Saskin',
  neutral: 'Notr',
};

export const EMOTION_EMOJIS: Record<Emotion, string> = {
  angry: '😡',
  disgusted: '🤢',
  fearful: '😨',
  happy: '😊',
  sad: '😢',
  surprised: '😲',
  neutral: '😐',
};
