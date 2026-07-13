'use client';

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, InterviewStatus, EmotionRecord } from '@/lib/types';

export function useInterview() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<InterviewStatus>('idle');
  const [report, setReport] = useState<string>('');
  const messagesRef = useRef<ChatMessage[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    speechSynthesis.cancel();
  }, []);

  const speakWithBrowser = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.05;

      const voices = speechSynthesis.getVoices();
      const turkishVoice =
        voices.find((v) => v.lang === 'tr-TR' && v.name.includes('Google')) ||
        voices.find((v) => v.lang.startsWith('tr'));
      if (turkishVoice) utterance.voice = turkishVoice;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      speechSynthesis.speak(utterance);
    });
  }, []);

  const createWavFromPcm = useCallback((pcmData: Uint8Array, sampleRate: number): Blob => {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const headerSize = 44;
    const wavBuffer = new ArrayBuffer(headerSize + pcmData.length);
    const view = new DataView(wavBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.length, true);

    new Uint8Array(wavBuffer, headerSize).set(pcmData);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }, []);

  const playAudio = useCallback((audioData: string, mimeType: string): Promise<void> => {
    return new Promise((resolve) => {
      const bytes = atob(audioData);
      const pcmData = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        pcmData[i] = bytes.charCodeAt(i);
      }

      const rateMatch = mimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;

      const blob = createWavFromPcm(pcmData, sampleRate);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        resolve();
      };
      audio.play();
    });
  }, [createWavFromPcm]);

  const sendMessage = useCallback(async (text: string): Promise<{
    text: string;
    audioData: string | null;
    audioMimeType: string | null;
  }> => {
    const userMsg: ChatMessage = { role: 'user', text };
    const updated = [...messagesRef.current, userMsg];
    messagesRef.current = updated;
    setMessages(updated);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: messagesRef.current.slice(0, -1) }),
    });

    const data = await res.json();
    const aiText = data.text || data.error || 'Bir hata oluştu.';

    const aiMsg: ChatMessage = { role: 'assistant', text: aiText };
    const withAi = [...messagesRef.current, aiMsg];
    messagesRef.current = withAi;
    setMessages(withAi);

    return {
      text: aiText,
      audioData: data.audioData || null,
      audioMimeType: data.audioMimeType || null,
    };
  }, []);

  const speakResponse = useCallback(async (response: {
    text: string;
    audioData: string | null;
    audioMimeType: string | null;
  }) => {
    if (response.audioData && response.audioMimeType) {
      await playAudio(response.audioData, response.audioMimeType);
    } else {
      await speakWithBrowser(response.text);
    }
  }, [playAudio, speakWithBrowser]);

  const startInterview = useCallback(async () => {
    setStatus('starting');
    setMessages([]);
    messagesRef.current = [];
    setReport('');

    try {
      const response = await sendMessage('Merhaba, görüşmeye hazırım. Lütfen ilk sorudan başla.');
      setStatus('speaking');
      await speakResponse(response);
      setStatus('listening');
    } catch {
      setStatus('idle');
    }
  }, [sendMessage, speakResponse]);

  const submitAnswer = useCallback(async (text: string) => {
    setStatus('processing');
    try {
      const response = await sendMessage(text);
      setStatus('speaking');
      await speakResponse(response);
      setStatus('listening');
    } catch {
      setStatus('listening');
    }
  }, [sendMessage, speakResponse]);

  const endInterview = useCallback(async (emotions: EmotionRecord[]) => {
    stopAudio();
    setStatus('reporting');

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesRef.current, emotions }),
      });

      const data = await res.json();
      setReport(data.report || data.error || 'Rapor oluşturulamadı.');
      setStatus('ended');
    } catch {
      setReport('Rapor oluşturulurken bir hata meydana geldi.');
      setStatus('ended');
    }
  }, [stopAudio]);

  const reset = useCallback(() => {
    stopAudio();
    setMessages([]);
    messagesRef.current = [];
    setReport('');
    setStatus('idle');
  }, [stopAudio]);

  return {
    messages,
    status,
    report,
    startInterview,
    submitAnswer,
    endInterview,
    reset,
  };
}
