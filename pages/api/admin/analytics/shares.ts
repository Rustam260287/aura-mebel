import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { verifyRole } from '../../../../lib/auth/rbac';

interface ShareStats {
    totalShares: number;
    totalViews: number;
    topObjects: Array<{
        objectId: string;
        shareCount: number;
        viewCount: number;
    }>;
    recentShares: Array<{
        id: string;
        objectId: string;
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

        const stats: ShareStats = {
            totalShares,
            totalViews,
            topObjects,
            recentShares,
        };

        return res.status(200).json(stats);
    } catch (error) {
        console.error('Share analytics error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
