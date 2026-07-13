'use client';

import type { InterviewStatus } from '@/lib/types';

interface ControlButtonsProps {
  status: InterviewStatus;
  isListening: boolean;
  isSpeechSupported: boolean;
  onStart: () => void;
  onEnd: () => void;
  onReset: () => void;
}

const STATUS_MESSAGES: Record<InterviewStatus, string> = {
  idle: 'Gorusmeyi baslatmak icin butona basin.',
  starting: 'Gorusme baslatiliyor...',
  speaking: 'Asistan konusuyor...',
  listening: 'Sizi dinliyor... Konusabilirsiniz.',
  processing: 'Dusunuyor...',
  reporting: 'Rapor hazirlaniyor...',
  ended: 'Gorusme tamamlandi.',
};

export function ControlButtons({
  status,
  isListening,
  isSpeechSupported,
  onStart,
  onEnd,
  onReset,
}: ControlButtonsProps) {
  const isInterviewActive = !['idle', 'ended'].includes(status);

  return (
    <div className="space-y-3">
      {status === 'idle' && (
        <button
          onClick={onStart}
          disabled={!isSpeechSupported}
          className="w-full py-4 text-lg font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          Gorusmeye Basla
        </button>
      )}

      {isInterviewActive && (
        <button
          onClick={onEnd}
          disabled={status === 'reporting'}
          className="w-full py-4 text-lg font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 shadow-lg"
        >
          Gorusmeyi Bitir ve Raporla
        </button>
      )}

      {status === 'ended' && (
        <button
          onClick={onReset}
          className="w-full py-4 text-lg font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg"
        >
          Yeni Gorusme Baslat
        </button>
      )}

      <div className={`text-center font-medium py-2 rounded-lg ${
        status === 'listening' ? 'text-red-600 bg-red-50' :
        status === 'speaking' ? 'text-green-600 bg-green-50' :
        status === 'processing' || status === 'reporting' ? 'text-orange-600 bg-orange-50' :
        'text-gray-600 bg-gray-50'
      }`}>
        {STATUS_MESSAGES[status]}
        {isListening && status === 'listening' && (
          <span className="inline-block ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>

      {!isSpeechSupported && (
        <div className="text-red-500 text-sm text-center bg-red-50 rounded-lg p-3">
          Tarayiciniz ses tanimayi desteklemiyor. Lutfen Chrome kullanin.
        </div>
      )}
    </div>
  );
}
