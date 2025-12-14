
import { NextApiRequest, NextApiResponse } from 'next';
import { MediaService } from '../../../lib/media/service';

export const config = {
  api: {
    bodyParser: false, // Disabling body parser to handle streams manually
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
    const buffer = await readStream(req);
    
    if (buffer.length === 0) {
        return res.status(400).json({ error: 'Empty file' });
    }

    const url = await MediaService.uploadBuffer(buffer, folder, mimeType);
    
    res.status(200).json({ url });

  } catch (error: any) {
    console.error('Upload API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
