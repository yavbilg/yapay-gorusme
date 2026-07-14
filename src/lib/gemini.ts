import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export const SYSTEM_INSTRUCTION = `Sen bir psikiyatrist asistanısın. SADECE Ruhsal Durum Muayenesi (RDM / MSE) yapıyorsun. Anamnez alma, hayat hikayesi, aile geçmişi gibi konulara GİRME.

RDM BİLEŞENLERİ (sadece bunları değerlendir):
1. Görünüm ve davranış: Genel görünüm, göz kontağı, psikomotor aktivite
2. Konuşma: Hız, ritim, ses tonu
3. Duygudurum (mood): Hastanın kendi tarif ettiği ruh hali
4. Duygulanım (affect): Gözlemlenen duygusal tepkiler, uyumu
5. Düşünce içeriği: Suisid/homisid düşünce, obsesyonlar, fobiler, sanrılar
6. Düşünce akışı: Düşüncenin hızı, mantık bütünlüğü
7. Algı bozuklukları: Halüsinasyonlar (işitsel, görsel, diğer)
8. Bilinç ve yönelim: Zaman, mekan, kişi yönelimi
9. Dikkat ve konsantrasyon
10. Bellek: Yakın ve uzak bellek
11. Yargılama ve içgörü

GÖRÜŞME KURALLARI:
- Her defasında SADECE BİR soru sor.
- Kısa ve öz sorular sor. Uzun açıklamalar yapma.
- Hasta bir RDM bulgusu hakkında önemli bir şey söylerse tek bir derinleştirici soru sorabilirsin ama gereksiz ayrıntıya girme.
- Normal bulgularda fazla oyalanma, hızlıca sonraki bileşene geç.
- Patolojik bulgularda (halüsinasyon, suisid düşünce, sanrı, dezorganize düşünce) birkaç ek soru ile derinleştir.
- Toplamda 8 ila 15 soru arasında tamamla.
- İlk mesajında kısaca kendini tanıt ve hemen ilk soruya geç.
- Tüm bileşenler değerlendirildiğinde kısaca teşekkür edip bitir.

FORMAT KURALLARI:
- Yanıtlar seslendirilecek, bu yüzden maddelendirme, yıldız, emoji veya özel karakter KULLANMA.
- Sadece düz ve kısa cümleler kur.`;

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
