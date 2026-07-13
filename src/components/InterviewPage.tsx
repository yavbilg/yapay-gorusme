'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useInterview } from '@/hooks/useInterview';
import { VideoFeed } from './VideoFeed';
import { ChatPanel } from './ChatPanel';
import { ControlButtons } from './ControlButtons';
import { ReportView } from './ReportView';

export function InterviewPage() {
  const face = useFaceDetection();
  const speech = useSpeechRecognition();
  const interview = useInterview();

  const speechRef = useRef(speech);
  speechRef.current = speech;
  const interviewRef = useRef(interview);
  interviewRef.current = interview;

  useEffect(() => {
    if (interview.status !== 'listening') return;

    let cancelled = false;

    const autoListen = async () => {
      while (!cancelled) {
        try {
          const text = await speechRef.current.listen();
          if (!cancelled && text.trim()) {
            await interviewRef.current.submitAnswer(text);
            return;
          }
        } catch {
          if (cancelled) return;
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    };

    autoListen();

    return () => {
      cancelled = true;
      speechRef.current.stopListening();
    };
  }, [interview.status]);

  const handleStart = useCallback(async () => {
    await face.start();
    await interview.startInterview();
  }, [face, interview]);

  const handleEnd = useCallback(async () => {
    speech.stopListening();
    face.stop();
    await interview.endInterview(face.emotionHistory);
  }, [speech, face, interview]);

  const handleReset = useCallback(() => {
    interview.reset();
    face.resetHistory();
  }, [interview, face]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-800 mb-2">
            Psikiyatrik Degerlendirme Asistani
          </h1>
          <p className="text-gray-600 text-lg">
            Ses tanima ve yuz analizi ile ruhsal durum muayenesi
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VideoFeed
            videoRef={face.videoRef}
            canvasRef={face.canvasRef}
            currentEmotion={face.currentEmotion}
            isActive={face.isActive}
            isLoading={face.isLoading}
          />

          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-4 min-h-[400px]">
            <ControlButtons
              status={interview.status}
              isListening={speech.isListening}
              isSpeechSupported={speech.isSupported}
              onStart={handleStart}
              onEnd={handleEnd}
              onReset={handleReset}
            />

            {speech.isListening && speech.transcript && (
              <div className="text-sm text-gray-500 italic bg-gray-50 rounded-lg p-3 border border-gray-200">
                {speech.transcript}
              </div>
            )}

            <ChatPanel messages={interview.messages} />
          </div>
        </div>

        <ReportView report={interview.report} />
      </div>
    </div>
  );
}
