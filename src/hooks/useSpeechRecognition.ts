'use client';

import { useRef, useState, useCallback } from 'react';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: {
    isFinal: boolean;
    [index: number]: { transcript: string };
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

const SILENCE_TIMEOUT_MS = 2000;

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = 'tr-TR';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = true;

      let finalTranscript = '';
      let hasReceivedSpeech = false;

      const finishListening = () => {
        clearSilenceTimer();
        recognition.stop();
      };

      const resetSilenceTimer = () => {
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          if (hasReceivedSpeech) {
            finishListening();
          }
        }, SILENCE_TIMEOUT_MS);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        hasReceivedSpeech = true;
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }

        setTranscript(finalTranscript + interim);
        resetSilenceTimer();
      };

      recognition.onerror = (event: { error: string }) => {
        clearSilenceTimer();
        setIsListening(false);
        setTranscript('');
        if (event.error !== 'aborted') {
          reject(new Error(event.error));
        }
      };

      recognition.onend = () => {
        clearSilenceTimer();
        setIsListening(false);
        const result = finalTranscript.trim();
        setTranscript('');
        if (result) {
          resolve(result);
        } else {
          reject(new Error('no-speech'));
        }
      };

      setIsListening(true);
      setTranscript('');
      recognition.start();
      resetSilenceTimer();
    });
  }, [isSupported, clearSilenceTimer]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
      setTranscript('');
    }
  }, [clearSilenceTimer]);

  return { listen, stopListening, isListening, isSupported, transcript };
}
