
import { NextApiRequest, NextApiResponse } from 'next';
import Replicate from 'replicate';
import admin from 'firebase-admin';
import { initializeFirebaseAdmin } from '../../../lib/firebaseAdmin'; // Используем новую функцию инициализации
import { randomUUID } from 'crypto';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const BUCKET_NAME = 'aura-mebel-7ec96.appspot.com';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    // Увеличиваем максимальное время выполнения до 90 секунд для генерации изображений
    responseLimit: false,
    maxDuration: 90, 
  },
};

const stylePrompts: { [key: string]: string } = {
    'Современный': 'A modern living room, photorealistic, elegant, minimalist furniture, neutral colors with a pop of color, 4k, high detail',
    'Минимализм': 'A minimalist room, clean lines, simple forms, neutral color palette, uncluttered space, photorealistic, 4k',
    'Неоклассика': 'A neoclassical interior, elegant and timeless, light colors, ornate details, classic furniture, photorealistic, 4k',
    'Лофт': 'A loft-style room, industrial elements, exposed brick, high ceilings, open space, photorealistic, 4k',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { imageBase64, style } = req.body;
    if (!imageBase64 || !style) {
      return res.status(400).json({ message: 'Необходимо загрузить изображение и выбрать стиль.' });
    }
    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ message: 'Replicate API token is not configured.' });
    }

    console.log(`[Replicate] Запрос на редизайн в стиле: ${style}`);
    const prompt = stylePrompts[style] || stylePrompts['Современный'];

    // --- Шаг 1: Запуск генерации в Replicate ---
    const prediction = await replicate.predictions.create({
      version: "854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b",
      input: {
        image: imageBase64,
        prompt: prompt,
        a_prompt: "best quality, extremely detailed, photorealistic, 4k, interior design",
        n_prompt: "lowres, bad anatomy, bad hands, cropped, worst quality, low quality, watermark",
      },
    });

    console.log(`[Replicate] Генерация запущена с ID: ${prediction.id}`);
    
    // --- Шаг 2: Ожидание завершения генерации ---
    const completedPrediction = await replicate.wait(prediction);

    if (completedPrediction.status !== 'succeeded' || !completedPrediction.output) {
      throw new Error(`Генерация изображения не удалась. Статус: ${completedPrediction.status}`);
    }

    const temporaryImageUrl = (completedPrediction.output as string[])[1];
    console.log('[Replicate] Изображение сгенерировано:', temporaryImageUrl);

    // --- Шаг 3: Скачивание и загрузка в Firebase Storage ---
    const imageResponse = await fetch(temporaryImageUrl);
    if (!imageResponse.ok) throw new Error('Не удалось скачать сгенерированное изображение.');
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const adminApp = initializeFirebaseAdmin();
    const bucket = adminApp.storage().bucket(BUCKET_NAME);
    const fileName = `redesigns/${randomUUID()}.png`;
    const file = bucket.file(fileName);

    await file.save(imageBuffer, {
        metadata: { contentType: 'image/png' },
        public: true,
    });

    const permanentImageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
    console.log('[Firebase] Изображение сохранено. Постоянный URL:', permanentImageUrl);

    res.status(200).json({ redesignedImageUrl: permanentImageUrl });

  } catch (error: any) {
    console.error('Ошибка в API редизайна:', error.message);
    res.status(500).json({ message: error.message || 'Произошла внутренняя ошибка сервера.' });
  }
}
