'use client';

import { EMOTION_EMOJIS, EMOTION_LABELS, type Emotion } from '@/lib/types';

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  currentEmotion: Emotion | null;
  isActive: boolean;
  isLoading: boolean;
}

export function VideoFeed({ videoRef, canvasRef, currentEmotion, isActive, isLoading }: VideoFeedProps) {
  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-cover ${isActive ? 'block' : 'hidden'}`}
      />

      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-3" />
              <p>Kamera ve yuz analizi yukleniyor...</p>
            </div>
          ) : (
            <p className="text-lg">Kamera bekleniyor...</p>
          )}
        </div>
      )}

      {isActive && currentEmotion && (
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="text-2xl">{EMOTION_EMOJIS[currentEmotion]}</span>
          <span className="text-white font-medium">{EMOTION_LABELS[currentEmotion]}</span>
        </div>
      )}
    </div>
  );
}
