
import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).send('URL parameter is missing');
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            return res.status(response.status).send(response.statusText);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Устанавливаем правильный MIME-тип для GLB
        res.setHeader('Content-Type', 'model/gltf-binary');
        res.send(buffer);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send('Error fetching the model');
    }
}
