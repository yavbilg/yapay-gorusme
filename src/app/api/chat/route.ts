import { NextRequest, NextResponse } from 'next/server';
import { getChatModel, textToSpeech } from '@/lib/gemini';
import type { ChatMessage } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = (await req.json()) as {
      message: string;
      history: ChatMessage[];
    };

    const model = getChatModel();
    const chat = model.startChat({
      history: history.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      })),
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();

    let audioData: string | null = null;
    let audioMimeType: string | null = null;

    try {
      const tts = await textToSpeech(text);
      audioData = tts.audioData;
      audioMimeType = tts.audioMimeType;
    } catch (ttsError) {
      console.warn('TTS failed, client will use browser fallback:', ttsError);
    }

    return NextResponse.json({ text, audioData, audioMimeType });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    );
  }
}
