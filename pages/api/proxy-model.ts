
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

    // Определяем Content-Type
    let contentType = 'model/gltf-binary'; // По умолчанию GLB
    
    // Проверка расширения в URL (учитываем возможные параметры запроса)
    const cleanUrl = url.split('?')[0].toLowerCase();
    
    if (cleanUrl.endsWith('.usdz')) {
        contentType = 'model/vnd.usdz+zip';
    } else if (cleanUrl.endsWith('.gltf')) {
        contentType = 'model/gltf+json';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy Model Error:', error);
    res.status(500).json({ error: 'Failed to proxy model' });
  }
}
