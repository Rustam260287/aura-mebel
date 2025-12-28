
import { NextApiRequest, NextApiResponse } from 'next';
import { MediaService } from '../../../lib/media/service';
import { checkIsAdmin } from '../../../lib/auth/admin-check';

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  try {
    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const contentType = req.headers['content-type'];
    const extension = req.headers['x-file-extension'];

    if (extension === 'glb' && contentType !== 'model/gltf-binary') {
      return res.status(415).json({ error: 'Invalid GLB file format.' });
    }

    if (extension === 'usdz' && contentType !== 'model/vnd.usdz+zip') {
      return res.status(415).json({ error: 'Invalid USDZ file format.' });
    }

    const buffer = await streamToBuffer(req);

    // Загружаем WebP в Storage
    const url = await MediaService.uploadBuffer(buffer, 'models', contentType as string);
    
    res.status(200).json({ url });

  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message || "Failed to upload file." });
  }
}
