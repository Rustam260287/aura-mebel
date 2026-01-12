import type { NextApiRequest, NextApiResponse } from 'next';
import { CuratorService } from '../../../lib/services/curatorService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const activeCurator = await CuratorService.getActiveCurator();

        // Fallback if system fails or no curators
        if (!activeCurator) {
            return res.status(200).json({
                displayName: 'Aura',
                status: 'offline',
                roleLabel: 'Сервис',
                // Default generic fallback
            });
        }

        return res.status(200).json(activeCurator);
    } catch (error) {
        console.error('Active curator fetch error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
