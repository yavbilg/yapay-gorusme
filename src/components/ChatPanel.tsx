'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/lib/types';

interface ChatPanelProps {
  messages: ChatMessage[];
}

export function ChatPanel({ messages }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 italic">
        Gorusme gecmisi burada gorunecek...
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
      {messages.map((msg, i) => {
        const isUser = msg.role === 'user';
        if (i === 0 && isUser) return null;
        return (
          <div
            key={i}
            className={`rounded-lg px-4 py-3 ${
              isUser
                ? 'bg-green-50 border border-green-200'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <span className={`font-semibold text-sm ${isUser ? 'text-green-700' : 'text-blue-700'}`}>
              {isUser ? 'Siz' : 'Asistan'}
            </span>
            <p className={`mt-1 ${isUser ? 'text-green-900' : 'text-blue-900'}`}>{msg.text}</p>
          </div>
        );
      })}
    </div>
  );
}
