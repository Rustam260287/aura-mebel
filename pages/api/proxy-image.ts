
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const imageRes = await fetch(url);
    if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageRes.status}`);

    const buffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get('content-type') || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Кэшируем на сутки
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
}
