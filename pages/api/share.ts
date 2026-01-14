// POST /api/share — Create a share link for an object/scene
import { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { getAdminDb } from '../../lib/firebaseAdmin';
import type { CreateShareRequest, CreateShareResponse, ShareRecord } from '../../types/share';

const SHARES_COLLECTION = 'shares';
const SHARE_TTL_DAYS = 30; // Links expire after 30 days

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const db = getAdminDb();
    if (!db) {
        return res.status(500).json({ error: 'Database not initialized' });
    }

    try {
        const body: CreateShareRequest = req.body;

        // Validation
        if (!body.objectId && !body.sceneId) {
            return res.status(400).json({ error: 'objectId or sceneId is required' });
        }

        // Generate short ID
        const shareId = nanoid(10); // 10 chars is enough for uniqueness

        // Calculate expiration
        const now = new Date();
        const expiresAt = new Date(now.getTime() + SHARE_TTL_DAYS * 24 * 60 * 60 * 1000);

        const shareRecord: ShareRecord = {
            id: shareId,
            objectId: body.objectId,
            ...(body.sceneId && { sceneId: body.sceneId }),
            ...(body.config && { config: body.config }),
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            viewCount: 0,
        };

        // Save to Firestore
        await db.collection(SHARES_COLLECTION).doc(shareId).set(shareRecord);

        // Construct share URL
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aura-room.ru';
        const shareUrl = `${baseUrl}/share/${shareId}`;

        const response: CreateShareResponse = {
            shareId,
            shareUrl,
        };

        // Analytics event (fire and forget)
        try {
            await db.collection('journeyEvents').add({
                type: 'SHARE_CREATED',
                shareId,
                objectId: body.objectId,
                sceneId: body.sceneId,
                timestamp: now.toISOString(),
            });
        } catch (e) {
            console.warn('Analytics event failed:', e);
        }

        res.status(201).json(response);
    } catch (error) {
        console.error('Create share error:', error);
        res.status(500).json({ error: 'Failed to create share link' });
    }
}
