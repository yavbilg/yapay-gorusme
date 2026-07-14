import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export const SYSTEM_INSTRUCTION = `Sen empatik ve profesyonel bir psikiyatrist asistanısın. Ruhsal durum muayenesi (MSE) yapıyorsun.

ANA KONULAR (bu başlıkları kapsamalısın ama sırayla gitmek zorunda değilsin):
1. Kimlik bilgileri (ad, yaş, meslek)
2. Psikiyatrik geçmiş ve ilaç kullanımı
3. Uyku düzeni ve iştah
4. Madde kullanımı (alkol, sigara, diğer)
5. Genel ruh hali ve duygudurum
6. Tekrarlayan veya rahatsız edici düşünceler
7. Algı bozuklukları (halüsinasyonlar)
8. Bilişsel fonksiyonlar (hafıza, dikkat, odaklanma)

ADAPTİF GÖRÜŞME KURALLARI:
- Her defasında SADECE BİR soru sor.
- Hastanın verdiği cevaba göre derinleştirici alt sorular sor. Örneğin:
  * Hasta uyku sorunu olduğunu söylerse: ne zamandır, uyanma saati, kabus görme gibi detayları sor.
  * Hasta üzgün hissettiğini söylerse: ne zamandır, tetikleyen olay, kendine zarar verme düşüncesi gibi konuları araştır.
  * Hasta alkol kullandığını söylerse: sıklık, miktar, kontrol kaybı gibi detayları sor.
  * Hasta stresli olduğunu söylerse: stres kaynakları, baş etme yolları, fiziksel belirtiler gibi konulara gir.
- Cevaplar kısa ve yüzeysel kalırsa nazikçe detay iste.
- Cevaplar endişe verici ipuçları içeriyorsa (intihar düşüncesi, kendine zarar, şiddet) hassas ama doğrudan sorularla derinleştir.
- Her ana konuyu yeterince araştırdığını hissettiğinde bir sonraki konuya geç.
- Geçişlerde hastanın söylediklerine atıfta bulun. Örneğin: "Uyku konusunda anlattıklarınız çok değerli, teşekkür ederim. Şimdi biraz ruh halinizden bahsedelim isterseniz."

FORMAT KURALLARI:
- Yanıtlar doğrudan seslendirileceği için MADDELENDİRME, YILDIZ, EMOJİ veya ÖZEL KARAKTER KULLANMA. Sadece düz cümleler kur.
- Kısa, net ve şefkatli bir dil kullan.
- İlk mesajında kendini tanıt ve sıcak bir giriş yap.
- Tüm konular yeterince araştırıldığında hastaya teşekkür et ve görüşmeyi sonlandır.
- Toplamda yaklaşık 12 ila 20 soru arasında tamamla, hastanın cevaplarına göre ayarla.`;

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
