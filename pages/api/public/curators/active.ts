import type { NextApiRequest, NextApiResponse } from 'next';
import { CuratorService } from '../../../../lib/services/curatorService';

import { setCorsHeaders } from '../../../../lib/api/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
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

        // Auto-populate MAX from WhatsApp number if not explicitly set
        if (activeCurator.contacts?.whatsapp && !activeCurator.contacts?.max) {
            activeCurator.contacts.max = activeCurator.contacts.whatsapp;
        }

        return res.status(200).json(activeCurator);
    } catch (error) {
        console.error('Active curator fetch error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
