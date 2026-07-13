import { NextRequest, NextResponse } from 'next/server';
import { getModel } from '@/lib/gemini';
import type { ChatMessage, EmotionRecord } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { messages, emotions } = (await req.json()) as {
      messages: ChatMessage[];
      emotions: EmotionRecord[];
    };

    const historyText = messages
      .map((m) => {
        const role = m.role === 'assistant' ? 'Psikiyatrist Asistanı' : 'Hasta';
        return `**${role}**: ${m.text}`;
      })
      .join('\n\n');

    let emotionSummary = 'Kamera verisi alınamadı.';
    if (emotions.length > 0) {
      const counts: Record<string, number> = {};
      for (const e of emotions) {
        counts[e.emotion] = (counts[e.emotion] || 0) + 1;
      }
      const total = emotions.length;
      emotionSummary = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([emo, count]) => `%${Math.round((count / total) * 100)} ${emo}`)
        .join(', ');
    }

    const prompt = `Sen uzman bir psikiyatristsin. Aşağıdaki hasta-asistan görüşme dökümünü ve kamera duygu analizini kullanarak profesyonel bir 'Kapsamlı Psikiyatrik Değerlendirme ve Ruhsal Durum Muayenesi' (Mental Status Examination - MSE) raporu hazırla.

KAMERA DUYGU ANALİZİ ÖZETİ (Görüşme boyunca):
${emotionSummary}

GÖRÜŞME DÖKÜMÜ:
${historyText}

Lütfen standart MSE başlıklarını (Görünüm ve Davranış, Duygudurum, Algı, Düşünce Süreci, Bilişsel İşlevler, Genel İzlenim vb.) içerecek şekilde resmi bir tıbbi rapor yaz. Görünüm ve Davranış ile Duygulanım başlıklarında kamera duygu analizi verilerini kesinlikle kullan ve hastanın anlattıklarıyla olan uyumunu yorumla.`;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ report: text });
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json(
      { error: 'Rapor oluşturulurken hata oluştu.' },
      { status: 500 }
    );
  }
}
