
import type { NextApiRequest, NextApiResponse } from 'next';

// Этот API-роут принимает URL изображения, скачивает его на сервере
// и возвращает в формате, который может использовать upscaler.js
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    // Преобразуем изображение в Buffer, а затем в base64 data URL
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    res.status(200).json({ dataUrl });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
}
