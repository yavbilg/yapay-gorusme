'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Emotion, EmotionRecord } from '@/lib/types';

export function useFaceDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const faceapiRef = useRef<typeof import('@vladmandic/face-api') | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(async () => {
    setIsLoading(true);
    try {
      const faceapi = await import('@vladmandic/face-api');
      faceapiRef.current = faceapi;

      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
    } catch (err) {
      console.error('Face detection start error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsActive(false);
    setCurrentEmotion(null);
  }, []);

  useEffect(() => {
    if (!isActive || !faceapiRef.current) return;

    const faceapi = faceapiRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastDetection = 0;
    const DETECTION_INTERVAL = 150;

    const detect = async (timestamp: number) => {
      if (!isActive) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (timestamp - lastDetection > DETECTION_INTERVAL) {
        lastDetection = timestamp;
        try {
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
            .withFaceExpressions();

          if (detections.length > 0) {
            const detection = detections[0];
            const { x, y, width, height } = detection.detection.box;

            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            const expressions = detection.expressions;
            const dominant = Object.entries(expressions).reduce((a, b) =>
              a[1] > b[1] ? a : b
            );
            const emotion = dominant[0] as Emotion;

            setCurrentEmotion(emotion);
            setEmotionHistory((prev) => [
              ...prev,
              { emotion, timestamp: Date.now() },
            ]);

            const EMOTION_EMOJIS: Record<string, string> = {
              angry: '😡', disgusted: '🤢', fearful: '😨',
              happy: '😊', sad: '😢', surprised: '😲', neutral: '😐',
            };

            ctx.font = '16px sans-serif';
            ctx.fillStyle = '#00ff00';
            ctx.fillText(
              `${EMOTION_EMOJIS[emotion] || ''} ${emotion.toUpperCase()}`,
              x,
              Math.max(16, y - 8)
            );
          }
        } catch {
          // Detection can fail between frames, ignore
        }
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isActive]);

  const resetHistory = useCallback(() => {
    setEmotionHistory([]);
  }, []);

  return {
    videoRef,
    canvasRef,
    currentEmotion,
    emotionHistory,
    isLoading,
    isActive,
    start,
    stop,
    resetHistory,
  };
}
