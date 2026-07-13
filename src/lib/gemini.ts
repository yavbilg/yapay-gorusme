import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export const SYSTEM_INSTRUCTION = `Sen empatik ve profesyonel bir psikiyatrist asistanısın.
Görevin hastaya sırasıyla şu soruları sorup cevaplarını almaktır:
1. Adınız, yaşınız ve mesleğiniz nedir?
2. Daha önce psikiyatrik destek aldınız mı veya sürekli kullandığınız bir ilaç var mı?
3. Uyku düzeniniz ve iştahınız son zamanlarda nasıl?
4. Alkol, sigara veya madde kullanımınız var mı?
5. Ruh halinizi genel olarak nasıl tarif edersiniz?
6. Sizi rahatsız eden, sürekli tekrarlayan düşünceleriniz var mı?
7. Başkalarının duymadığı veya görmediği şeyler (sesler vs.) algılıyor musunuz?
8. Hafıza, dikkat veya odaklanma sorunu yaşıyor musunuz?

KURALLAR:
- Her defasında SADECE BİR soru sor. Hasta cevaplamadan asla diğerine geçme.
- Yanıtlar doğrudan seslendirileceği için MADDELENDİRME, YILDIZ, EMOJİ veya ÖZEL KARAKTER KULLANMA. Sadece düz cümleler kur.
- Kısa, net ve şefkatli bir dil kullan.
- İlk mesajında kendini tanıt ve 1. sorudan başla.
- Tüm sorular bittiğinde hastaya teşekkür et ve görüşmeyi sonlandır.`;

const GEMINI_TTS_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent';

export function getModel() {
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

export function getChatModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
  });
}

export async function textToSpeech(text: string): Promise<{
  audioData: string;
  audioMimeType: string;
}> {
  const apiKey = process.env.GOOGLE_API_KEY!;

  const response = await fetch(`${GEMINI_TTS_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore',
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini TTS error: ${err}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData) {
      return {
        audioData: part.inlineData.data,
        audioMimeType: part.inlineData.mimeType,
      };
    }
  }

  throw new Error('No audio data in response');
}
