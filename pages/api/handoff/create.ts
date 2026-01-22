import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

interface CreateHandoffBody {
    visitorId: string;
    objectId: string;

    arSessionId?: string; // v1.1: Link to AR session
    source?: 'AR' | 'SHARE';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const db = getAdminDb();
    if (!db) {
        return res.status(500).json({ error: 'Database not initialized' });
    }

    try {
        const body = req.body as CreateHandoffBody;

        if (!body.visitorId || !body.objectId) {
            return res.status(400).json({ error: 'visitorId and objectId are required' });
        }

        const handoffData = {
            visitorId: body.visitorId,
            objectId: body.objectId,

            arSessionId: body.arSessionId || null, // v1.1
            source: body.source || 'AR',
            status: 'saved',
            createdAt: FieldValue.serverTimestamp(),
            lastUpdatedAt: FieldValue.serverTimestamp(), // v1.1: renamed from updatedAt
        };

        const docRef = await db.collection('handoffs').add(handoffData);

        return res.status(201).json({
            id: docRef.id,
            status: 'saved',
        });
    } catch (error) {
        console.error('[handoff/create] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to create handoff';
        return res.status(500).json({ error: message });
    }
}
