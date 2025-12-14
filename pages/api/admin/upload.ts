
import { NextApiRequest, NextApiResponse } from 'next';
import { MediaService } from '../../../lib/media/service';
import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readStream(req: NextApiRequest): Promise<Buffer> {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const folder = req.query.folder as string || 'uploads';
    const mimeType = req.headers['content-type'] || 'application/octet-stream';
    
    // Read raw body
    let buffer = await readStream(req);
    
    if (buffer.length === 0) {
        return res.status(400).json({ error: 'Empty file' });
    }

    let finalMimeType = mimeType;
    
    // Image Optimization
    if (mimeType.startsWith('image/') && !mimeType.includes('svg')) {
        try {
            console.log(`Optimizing image (${mimeType})...`);
            buffer = await sharp(buffer)
                .rotate() // Auto-rotate based on EXIF
                .resize({ 
                    width: 1920, 
                    height: 1920, 
                    fit: 'inside', 
                    withoutEnlargement: true 
                })
                .webp({ quality: 80, effort: 4 }) // Convert to WebP
                .toBuffer();
            
            finalMimeType = 'image/webp';
            console.log('Image optimized to WebP');
        } catch (e) {
            console.error('Image optimization failed, uploading original:', e);
        }
    }

    const url = await MediaService.uploadBuffer(buffer, folder, finalMimeType);
    
    res.status(200).json({ url });

  } catch (error: any) {
    console.error('Upload API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
