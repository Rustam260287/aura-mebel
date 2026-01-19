import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { visitorId } = req.query;

    if (!visitorId || typeof visitorId !== 'string') {
        return res.status(400).json({ error: 'visitorId query param is required' });
    }

    const db = getAdminDb();
    if (!db) {
        return res.status(500).json({ error: 'Database not initialized' });
    }

    try {
        const snapshot = await db
            .collection('handoffs')
            .where('visitorId', '==', visitorId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const handoffs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore timestamps to ISO strings
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
            lastUpdatedAt: doc.data().lastUpdatedAt?.toDate?.()?.toISOString() || null,
        }));

        return res.status(200).json({ handoffs });
    } catch (error) {
        console.error('[handoff/list] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch handoffs';
        return res.status(500).json({ error: message });
    }
}
