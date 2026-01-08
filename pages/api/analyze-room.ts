import type { NextApiRequest, NextApiResponse } from 'next';
import { ContextAgent } from '../../lib/antigravity/agents/context';
import type { RoomAnalysis } from '../../lib/antigravity/types';

type ResponseData = RoomAnalysis | { error: string };

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Разрешаем большие изображения
        },
    },
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        const { imageBase64, userDescription } = req.body;

        if (!imageBase64 && !userDescription) {
            return res.status(400).json({ error: 'Missing imageBase64 or userDescription' });
        }

        console.log('[API] Analyzing room context...');

        const analysis = await ContextAgent.analyze({
            imageBase64,
            userDescription,
        });

        console.log('[API] Analysis result:', analysis.room_type, analysis.confidence);

        return res.status(200).json(analysis);
    } catch (error) {
        console.error('[API] Analysis failed:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
