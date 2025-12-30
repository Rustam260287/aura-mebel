
import { NextApiRequest, NextApiResponse } from 'next';
import { MediaService } from '../../../lib/media/service';
import { checkIsAdmin } from '../../../lib/auth/admin-check';
import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: false, // Отключаем, чтобы получить stream
  },
};

const streamToBuffer = (stream: NodeJS.ReadableStream): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
};

const sanitizeFolder = (folder?: string) => {
  if (!folder) return 'media';
  return folder.replace(/[^a-zA-Z0-9\-_/]/g, '') || 'media';
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Allow', ['POST', 'OPTIONS']);
      return res.status(200).json({ ok: true });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST', 'OPTIONS']);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(415).json({ error: 'Unsupported file type' });
    }

    const buffer = await streamToBuffer(req);
    const folder = sanitizeFolder(req.query.folder as string);

    // Конвертация в WebP
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();

    // Загружаем WebP в Storage
    const url = await MediaService.uploadBuffer(webpBuffer, folder, 'image/webp');
    
    res.status(200).json({ url });

  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error?.message ? String(error.message) : 'Internal Server Error' });
  }
}
