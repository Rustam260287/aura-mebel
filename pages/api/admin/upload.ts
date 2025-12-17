
import { NextApiRequest, NextApiResponse } from 'next';
import { MediaService } from '../../../lib/media/service';
import sharp from 'sharp';
import { verifyAdmin } from '../../../lib/auth/admin-check';

export const config = {
  api: {
    bodyParser: false, // Отключаем стандартный парсер, чтобы читать поток
  },
};

// Функция для чтения всего тела запроса в буфер
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Проверяем админа
    const isAdmin = await verifyAdmin(req, res);
    if (!isAdmin) return; // verifyAdmin сам отправляет 401/403

    const folder = req.query.folder as string || 'uploads';
    const mimeType = req.headers['content-type'] || 'application/octet-stream';
    
    // 2. Читаем файл
    // ВАЖНО: Мы читаем raw body, так как клиент отправляет файл напрямую в body
    const buffer = await getRawBody(req);
    
    if (buffer.length === 0) {
        return res.status(400).json({ error: 'Empty file' });
    }

    let finalMimeType = mimeType;
    let finalBuffer = buffer;
    
    // 3. Оптимизация (только для картинок)
    if (mimeType.startsWith('image/') && !mimeType.includes('svg') && !mimeType.includes('gif')) {
        try {
            console.log(`Optimizing image (${mimeType})...`);
            finalBuffer = await sharp(buffer)
                .rotate()
                .resize({ 
                    width: 1920, 
                    height: 1920, 
                    fit: 'inside', 
                    withoutEnlargement: true 
                })
                .webp({ quality: 80, effort: 3 }) // Уменьшил effort для скорости
                .toBuffer();
            
            finalMimeType = 'image/webp';
        } catch (e) {
            console.error('Image optimization failed, uploading original:', e);
        }
    }

    // 4. Загрузка в Storage
    const url = await MediaService.uploadBuffer(finalBuffer, folder, finalMimeType);
    
    res.status(200).json({ url });

  } catch (error: any) {
    console.error('Upload API Error:', error);
    // Важно вернуть JSON, а не HTML страницу ошибки Next.js
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
