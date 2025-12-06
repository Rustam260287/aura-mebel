
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminStorage } from '../../../lib/firebaseAdmin';
import { randomUUID } from 'crypto';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Разрешаем большие картинки (base64)
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body; // Ожидаем base64 string
    if (!image) return res.status(400).json({ error: 'No image provided' });

    // Убираем заголовок data:image/..., если он есть
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    
    // Генерируем уникальное имя файла
    const filename = `ai-designs/${randomUUID()}.jpg`;
    const file = bucket.file(filename);

    // Загружаем в Firebase Storage
    await file.save(buffer, {
      metadata: { 
          contentType: 'image/jpeg',
          cacheControl: 'public, max-age=31536000' // Кешируем надолго
      },
    });

    // Делаем файл публично доступным
    await file.makePublic();
    
    // Формируем прямую ссылку на файл
    // Используем стандартный формат Google Cloud Storage URLs
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    res.status(200).json({ url: publicUrl });

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
