// GET /api/share/[id] — Get share record for display
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import type { ShareRecord } from '../../../types/share';

const SHARES_COLLECTION = 'shares';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Share ID is required' });
    }

    const db = getAdminDb();
    if (!db) {
        return res.status(500).json({ error: 'Database not initialized' });
    }

    try {
        const docRef = db.collection(SHARES_COLLECTION).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Share not found' });
        }

        const shareRecord = doc.data() as ShareRecord;

        // Check expiration
        if (shareRecord.expiresAt) {
            const expiresAt = new Date(shareRecord.expiresAt);
            if (expiresAt < new Date()) {
                return res.status(410).json({ error: 'Share link has expired' });
            }
        }

        // Increment view count (fire and forget)
        docRef.update({
            viewCount: (shareRecord.viewCount || 0) + 1,
        }).catch(() => { });

        // Analytics event (fire and forget)
        try {
            await db.collection('journeyEvents').add({
                type: 'SHARE_OPENED',
                shareId: id,
                objectId: shareRecord.objectId,
                sceneId: shareRecord.sceneId,
                timestamp: new Date().toISOString(),
            });
        } catch (e) {
            console.warn('Analytics event failed:', e);
        }

        // Cache for 1 hour
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
        res.status(200).json(shareRecord);
    } catch (error) {
        console.error('Get share error:', error);
        res.status(500).json({ error: 'Failed to get share data' });
    }
}
