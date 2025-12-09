
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch model: ${response.status}`);

    const buffer = await response.arrayBuffer();

    // Важно: Правильный MIME-тип для GLB
    res.setHeader('Content-Type', 'model/gltf-binary');
    // Разрешаем доступ отовсюду
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy Model Error:', error);
    res.status(500).json({ error: 'Failed to proxy model' });
  }
}
