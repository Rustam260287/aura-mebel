import type { NextApiRequest, NextApiResponse } from 'next';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireOwnerSession } from '../../../../lib/auth/admin-session';
import { COLLECTIONS } from '../../../../lib/db/collections';

const clampDays = (value: unknown, fallback: number) => {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(365, Math.max(1, Math.floor(n)));
};

type TopSavedRow = { objectId: string; objectName: string | null; saves: number };

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
    const eventsSnap = await db
      .collection('journeyEvents')
      .where('createdAt', '>=', fromTs)
      .where('createdAt', '<=', toTs)
      .orderBy('createdAt', 'asc')
      .select('type', 'visitorId', 'objectId')
      .get();

    const visitorsWithSaved = new Set<string>();
    const savedEventsByObject = new Map<string, number>();
    let totalSaves = 0;

    for (const doc of eventsSnap.docs) {
      const data = doc.data() as { type?: unknown; visitorId?: unknown; objectId?: unknown };
      const type = typeof data.type === 'string' ? data.type : '';
      if (type !== 'SAVE_OBJECT') continue;
      const visitorId = typeof data.visitorId === 'string' ? data.visitorId : '';
      const objectId = typeof data.objectId === 'string' ? data.objectId : '';
      if (visitorId) visitorsWithSaved.add(visitorId);
      if (objectId) {
        savedEventsByObject.set(objectId, (savedEventsByObject.get(objectId) || 0) + 1);
      }
      totalSaves += 1;
    }

    const top = Array.from(savedEventsByObject.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    const refs = top.map(([id]) => db.collection(COLLECTIONS.objects).doc(id));
    const docs = refs.length > 0 ? await db.getAll(...refs) : [];
    const idToName = new Map<string, string>();
    for (const doc of docs) {
      if (!doc.exists) continue;
      const data = doc.data() as { name?: unknown } | undefined;
      const name = typeof data?.name === 'string' ? data.name : '';
      if (name) idToName.set(doc.id, name);
    }

    const topSaved: TopSavedRow[] = top.map(([objectId, saves]) => ({
      objectId,
      objectName: idToName.get(objectId) || null,
      saves,
    }));

    return res.status(200).json({
      period: { from: from.toISOString(), to: to.toISOString(), days },
      totals: {
        visitorsWithSaved: visitorsWithSaved.size,
        totalSaves,
        uniqueSavedObjects: savedEventsByObject.size,
      },
      topSaved,
    });
  } catch (error) {
    console.error('saved insights error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load saved insights';
    return res.status(500).json({ error: message });
  }
}
