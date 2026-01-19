import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

type HandoffStatus = 'saved' | 'sent' | 'opened' | 'discussed'; // v1.1: added 'opened'

interface UpdateHandoffBody {
    status?: HandoffStatus;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Handoff ID is required' });
    }

    const db = getAdminDb();
    if (!db) {
        return res.status(500).json({ error: 'Database not initialized' });
    }

    const docRef = db.collection('handoffs').doc(id);

    try {
        // GET: Fetch handoff details
        if (req.method === 'GET') {
            const snap = await docRef.get();
            if (!snap.exists) {
                return res.status(404).json({ error: 'Handoff not found' });
            }

            // v1.1: Track 'opened' status on GET (if not already)
            const data = snap.data();
            if (data?.status === 'saved' || data?.status === 'sent') {
                await docRef.update({
                    status: 'opened',
                    lastUpdatedAt: FieldValue.serverTimestamp(),
                });
            }

            return res.status(200).json({ id: snap.id, ...snap.data() });
        }

        // PATCH: Update status
        if (req.method === 'PATCH') {
            const body = req.body as UpdateHandoffBody;

            const updates: Record<string, any> = {
                lastUpdatedAt: FieldValue.serverTimestamp(), // v1.1: renamed
            };

            if (body.status && ['saved', 'sent', 'opened', 'discussed'].includes(body.status)) {
                updates.status = body.status;
            }

            await docRef.update(updates);

            return res.status(200).json({ id, status: body.status || 'updated' });
        }

        res.setHeader('Allow', 'GET, PATCH');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('[handoff/[id]] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to process handoff';
        return res.status(500).json({ error: message });
    }
}
