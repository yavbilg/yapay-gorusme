'use client';

import { useEffect, useRef } from 'react';
import type { Emotion, EmotionRecord } from '@/lib/types';
import { EMOTION_EMOJIS } from '@/lib/types';

interface EmotionChartProps {
  emotionHistory: EmotionRecord[];
  isActive: boolean;
}

const EMOTION_COLORS: Record<Emotion, string> = {
  happy: '#22c55e',
  neutral: '#6b7280',
  sad: '#3b82f6',
  angry: '#ef4444',
  fearful: '#f59e0b',
  surprised: '#a855f7',
  disgusted: '#14b8a6',
};

const EMOTION_Y: Record<Emotion, number> = {
  happy: 0,
  surprised: 1,
  neutral: 2,
  fearful: 3,
  sad: 4,
  disgusted: 5,
  angry: 6,
};

const EMOTIONS_ORDERED: Emotion[] = ['happy', 'surprised', 'neutral', 'fearful', 'sad', 'disgusted', 'angry'];

export function EmotionChart({ emotionHistory, isActive }: EmotionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const paddingLeft = 36;
    const paddingRight = 12;
    const paddingTop = 12;
    const paddingBottom = 24;
    const chartW = w - paddingLeft - paddingRight;
    const chartH = h - paddingTop - paddingBottom;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const emotionCount = EMOTIONS_ORDERED.length;
    for (let i = 0; i < emotionCount; i++) {
      const y = paddingTop + (i / (emotionCount - 1)) * chartH;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(w - paddingRight, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(EMOTION_EMOJIS[EMOTIONS_ORDERED[i]], paddingLeft - 4, y);
    }

    if (emotionHistory.length < 2) {
      if (emotionHistory.length === 0 && !isActive) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Gorusme basladiginda duygu grafigi burada gorunecek', w / 2, h / 2);
      }
      return;
    }

    const windowSize = 120;
    const visibleData = emotionHistory.slice(-windowSize);
    const startTime = visibleData[0].timestamp;
    const endTime = visibleData[visibleData.length - 1].timestamp;
    const timeRange = Math.max(endTime - startTime, 1000);

    for (let i = 1; i < visibleData.length; i++) {
      const prev = visibleData[i - 1];
      const curr = visibleData[i];

      const x1 = paddingLeft + ((prev.timestamp - startTime) / timeRange) * chartW;
      const y1 = paddingTop + (EMOTION_Y[prev.emotion] / (emotionCount - 1)) * chartH;
      const x2 = paddingLeft + ((curr.timestamp - startTime) / timeRange) * chartW;
      const y2 = paddingTop + (EMOTION_Y[curr.emotion] / (emotionCount - 1)) * chartH;

      ctx.strokeStyle = EMOTION_COLORS[curr.emotion];
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const last = visibleData[visibleData.length - 1];
    const lastX = paddingLeft + ((last.timestamp - startTime) / timeRange) * chartW;
    const lastY = paddingTop + (EMOTION_Y[last.emotion] / (emotionCount - 1)) * chartH;

    ctx.fillStyle = EMOTION_COLORS[last.emotion];
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const elapsed = Math.floor((endTime - emotionHistory[0].timestamp) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(
      `${minutes}:${seconds.toString().padStart(2, '0')}`,
      w - paddingRight,
      h - paddingBottom + 6
    );
  }, [emotionHistory, isActive]);

  const emotionCounts: Partial<Record<Emotion, number>> = {};
  for (const record of emotionHistory) {
    emotionCounts[record.emotion] = (emotionCounts[record.emotion] || 0) + 1;
  }

  const topEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const total = emotionHistory.length || 1;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Duygu Analizi</h3>
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg"
        style={{ height: 180 }}
      />
      {topEmotions.length > 0 && (
        <div className="flex gap-3 mt-3 justify-center">
          {topEmotions.map(([emotion, count]) => (
            <div
              key={emotion}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${EMOTION_COLORS[emotion as Emotion]}15`, color: EMOTION_COLORS[emotion as Emotion] }}
            >
              <span>{EMOTION_EMOJIS[emotion as Emotion]}</span>
              <span className="font-medium">{Math.round((count / total) * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
