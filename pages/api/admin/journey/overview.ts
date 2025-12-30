import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireOwnerSession } from '../../../../lib/auth/admin-session';
import { Timestamp } from 'firebase-admin/firestore';

const clampDays = (value: unknown, fallback: number) => {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(365, Math.max(1, Math.floor(n)));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireOwnerSession(req, res);
  if (!session) return;

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  const days = clampDays(req.query.days, 30);
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const fromTs = Timestamp.fromDate(from);
  const toTs = Timestamp.fromDate(to);

  try {
    const visitorsSnap = await db.collection('visitors').where('lastSeenAt', '>=', fromTs).get();
    const totalVisitors = visitorsSnap.size;

    const eventsSnap = await db
      .collection('journeyEvents')
      .where('createdAt', '>=', fromTs)
      .where('createdAt', '<=', toTs)
      .orderBy('createdAt', 'asc')
      .select('visitorId', 'type', 'createdAt')
      .get();

    const viewed = new Set<string>();
    const opened3d = new Set<string>();
    const ar = new Set<string>();
    const saved = new Set<string>();
    const contacted = new Set<string>();

    for (const doc of eventsSnap.docs) {
      const data = doc.data() as { visitorId?: unknown; type?: unknown };
      const visitorId = typeof data.visitorId === 'string' ? data.visitorId : '';
      const type = typeof data.type === 'string' ? data.type : '';
      if (!visitorId) continue;

      if (type === 'VIEW_OBJECT') viewed.add(visitorId);
      if (type === 'OPEN_3D') opened3d.add(visitorId);
      if (type === 'START_AR' || type === 'FINISH_AR') ar.add(visitorId);
      if (type === 'SAVE_OBJECT') saved.add(visitorId);
      if (type === 'HANDOFF_REQUESTED') contacted.add(visitorId);
    }

    return res.status(200).json({
      period: { from: from.toISOString(), to: to.toISOString(), days },
      totals: {
        visitors: totalVisitors,
        viewedObjectVisitors: viewed.size,
        opened3dVisitors: opened3d.size,
        arVisitors: ar.size,
        savedVisitors: saved.size,
        contactedVisitors: contacted.size,
      },
    });
  } catch (error) {
    console.error('journey overview error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load overview';
    return res.status(500).json({ error: message });
  }
}
