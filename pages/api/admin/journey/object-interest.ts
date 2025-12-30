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

type ObjectInterestRow = {
  objectId: string;
  objectName: string | null;
  viewed: number;
  opened3d: number;
  arSessions: number;
  saved: number;
  avgArDurationSec: number | null;
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
    const eventsSnap = await db
      .collection('journeyEvents')
      .where('createdAt', '>=', fromTs)
      .where('createdAt', '<=', toTs)
      .orderBy('createdAt', 'asc')
      .select('type', 'objectId', 'meta')
      .get();

    const stats = new Map<
      string,
      {
        viewed: number;
        opened3d: number;
        arSessions: number;
        saved: number;
        arDurationTotalSec: number;
        arDurationCount: number;
      }
    >();

    for (const doc of eventsSnap.docs) {
      const data = doc.data() as { type?: unknown; objectId?: unknown; meta?: unknown };
      const type = typeof data.type === 'string' ? data.type : '';
      const objectId = typeof data.objectId === 'string' ? data.objectId : '';
      if (!objectId) continue;

      if (!stats.has(objectId)) {
        stats.set(objectId, {
          viewed: 0,
          opened3d: 0,
          arSessions: 0,
          saved: 0,
          arDurationTotalSec: 0,
          arDurationCount: 0,
        });
      }

      const row = stats.get(objectId)!;
      if (type === 'VIEW_OBJECT') row.viewed += 1;
      if (type === 'OPEN_3D') row.opened3d += 1;
      if (type === 'SAVE_OBJECT') row.saved += 1;
      if (type === 'FINISH_AR') {
        row.arSessions += 1;
        if (data.meta && typeof data.meta === 'object') {
          const meta = data.meta as { durationSec?: unknown };
          if (typeof meta.durationSec === 'number' && Number.isFinite(meta.durationSec) && meta.durationSec >= 0) {
            row.arDurationTotalSec += meta.durationSec;
            row.arDurationCount += 1;
          }
        }
      }
    }

    const objectIds = Array.from(stats.keys());
    const refs = objectIds.map((id) => db.collection(COLLECTIONS.objects).doc(id));
    const docs = refs.length > 0 ? await db.getAll(...refs) : [];
    const idToName = new Map<string, string>();
    const missingIds: string[] = [];
    for (const doc of docs) {
      if (!doc.exists) {
        missingIds.push(doc.id);
        continue;
      }
      const data = doc.data() as { name?: unknown } | undefined;
      const name = typeof data?.name === 'string' ? data.name : '';
      if (name) idToName.set(doc.id, name);
    }

    if (missingIds.length > 0) {
      const sceneRefs = missingIds.map((id) => db.collection(COLLECTIONS.scenePresets).doc(id));
      const sceneDocs = sceneRefs.length > 0 ? await db.getAll(...sceneRefs) : [];
      for (const doc of sceneDocs) {
        if (!doc.exists) continue;
        const data = doc.data() as { title?: unknown } | undefined;
        const title = typeof data?.title === 'string' ? data.title : '';
        if (title) idToName.set(doc.id, title);
      }
    }

    const rows: ObjectInterestRow[] = objectIds.map((id) => {
      const row = stats.get(id)!;
      const avgArDurationSec =
        row.arDurationCount > 0 ? Math.round(row.arDurationTotalSec / row.arDurationCount) : null;
      return {
        objectId: id,
        objectName: idToName.get(id) || null,
        viewed: row.viewed,
        opened3d: row.opened3d,
        arSessions: row.arSessions,
        saved: row.saved,
        avgArDurationSec,
      };
    });

    rows.sort((a, b) => b.viewed - a.viewed);

    return res.status(200).json({
      period: { from: from.toISOString(), to: to.toISOString(), days },
      objects: rows,
    });
  } catch (error) {
    console.error('object interest error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load object stats';
    return res.status(500).json({ error: message });
  }
}
