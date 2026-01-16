import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { verifyRole } from '../../../../lib/auth/rbac';
import { COLLECTIONS } from '../../../../lib/db/collections';

interface ShareStats {
    totalShares: number;
    totalViews: number;
    topObjects: Array<{
        objectId: string;
        objectName?: string;
        shareCount: number;
        viewCount: number;
    }>;
    recentShares: Array<{
        id: string;
        objectId: string;
        objectName?: string;
        createdAt: string;
        viewCount: number;
    }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Require admin access
    const hasAccess = await verifyRole(req, res, ['owner', 'admin']);
    if (!hasAccess) return;

    try {
        const db = getAdminDb();
        const sharesSnap = await db.collection('shares').get();

        if (sharesSnap.empty) {
            return res.status(200).json({
                totalShares: 0,
                totalViews: 0,
                topObjects: [],
                recentShares: [],
            } as ShareStats);
        }

        const shares = sharesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Array<{
            id: string;
            objectId?: string;
            createdAt?: string;
            viewCount?: number;
        }>;

        // Calculate totals
        const totalShares = shares.length;
        const totalViews = shares.reduce((sum, s) => sum + (s.viewCount || 0), 0);

        // Group by objectId
        const objectStats = new Map<string, { shareCount: number; viewCount: number }>();
        for (const share of shares) {
            if (!share.objectId) continue;
            const existing = objectStats.get(share.objectId) || { shareCount: 0, viewCount: 0 };
            existing.shareCount++;
            existing.viewCount += share.viewCount || 0;
            objectStats.set(share.objectId, existing);
        }

        // Top 5 objects by share count
        const topObjects = Array.from(objectStats.entries())
            .map(([objectId, stats]) => ({ objectId, ...stats }))
            .sort((a, b) => b.shareCount - a.shareCount)
            .slice(0, 5);

        // Recent 10 shares
        const recentShares = shares
            .filter(s => s.objectId && s.createdAt)
            .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
            .slice(0, 10)
            .map(s => ({
                id: s.id,
                objectId: s.objectId!,
                createdAt: s.createdAt!,
                viewCount: s.viewCount || 0,
            }));

        // === Resolve Names ===
        const objectIds = new Set<string>();
        topObjects.forEach(o => objectIds.add(o.objectId));
        recentShares.forEach(s => objectIds.add(s.objectId));

        const uniqueIds = Array.from(objectIds);
        const nameMap = new Map<string, string>();

        if (uniqueIds.length > 0) {
            // 1. Try fetching from objects collection
            const refs = uniqueIds.map(id => db.collection(COLLECTIONS.objects).doc(id));
            const docs = await db.getAll(...refs);
            const missingIds: string[] = [];

            docs.forEach(doc => {
                if (doc.exists) {
                    const data = doc.data() as { name?: string };
                    if (data?.name) nameMap.set(doc.id, data.name);
                } else {
                    missingIds.push(doc.id);
                }
            });

            // 2. Try fetching from scenePresets for missing IDs
            if (missingIds.length > 0) {
                const sceneRefs = missingIds.map(id => db.collection(COLLECTIONS.scenePresets).doc(id));
                const sceneDocs = await db.getAll(...sceneRefs);
                sceneDocs.forEach(doc => {
                    if (doc.exists) {
                        const data = doc.data() as { title?: string };
                        if (data?.title) nameMap.set(doc.id, data.title);
                    }
                });
            }
        }

        // Attach names
        const topObjectsWithNames = topObjects.map(o => ({
            ...o,
            objectName: nameMap.get(o.objectId)
        }));

        const recentSharesWithNames = recentShares.map(s => ({
            ...s,
            objectName: nameMap.get(s.objectId)
        }));

        const stats: ShareStats = {
            totalShares,
            totalViews,
            topObjects: topObjectsWithNames,
            recentShares: recentSharesWithNames,
        };

        return res.status(200).json(stats);
    } catch (error) {
        console.error('Share analytics error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
