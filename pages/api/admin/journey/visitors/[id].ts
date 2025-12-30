import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../../lib/firebaseAdmin';
import { requireOwnerSession } from '../../../../../lib/auth/admin-session';
import { COLLECTIONS } from '../../../../../lib/db/collections';

const toIso = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null;
  const maybe = value as { toDate?: () => Date };
  if (typeof maybe.toDate !== 'function') return null;
  return maybe.toDate().toISOString();
};

type VisitorDetails = {
  id: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  device: 'mobile' | 'desktop' | null;
  os: 'ios' | 'android' | 'other' | null;
  country: string | null;
  savedObjectIds: string[];
};

type EventRow = {
  id: string;
  type: string;
  objectId: string | null;
  objectName: string | null;
  createdAt: string | null;
  meta: Record<string, unknown> | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireOwnerSession(req, res);
  if (!session) return;

  const visitorId = typeof req.query.id === 'string' ? req.query.id : '';
  if (!visitorId) return res.status(400).json({ error: 'Invalid visitor id' });

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  try {
    const visitorDoc = await db.collection('visitors').doc(visitorId).get();
    if (!visitorDoc.exists) return res.status(404).json({ error: 'Visitor not found' });

    const visitorData = visitorDoc.data() as Record<string, unknown>;
    const savedObjectIds = Array.isArray(visitorData.savedObjectIds)
      ? visitorData.savedObjectIds.filter((v) => typeof v === 'string')
      : [];

    const visitor: VisitorDetails = {
      id: visitorDoc.id,
      firstSeenAt: toIso(visitorData.firstSeenAt),
      lastSeenAt: toIso(visitorData.lastSeenAt),
      device: visitorData.device === 'mobile' || visitorData.device === 'desktop' ? visitorData.device : null,
      os: visitorData.os === 'ios' || visitorData.os === 'android' || visitorData.os === 'other' ? visitorData.os : null,
      country: typeof visitorData.country === 'string' ? visitorData.country : null,
      savedObjectIds,
    };

    const eventsSnap = await db
      .collection('journeyEvents')
      .where('visitorId', '==', visitorId)
      .orderBy('createdAt', 'asc')
      .limit(300)
      .get();

    const objectIds = new Set<string>();
    for (const doc of eventsSnap.docs) {
      const data = doc.data() as { objectId?: unknown };
      const objectId = typeof data.objectId === 'string' ? data.objectId : '';
      if (objectId) objectIds.add(objectId);
    }

    const refs = Array.from(objectIds).map((id) => db.collection(COLLECTIONS.objects).doc(id));
    const docs = refs.length > 0 ? await db.getAll(...refs) : [];
    const idToName = new Map<string, string>();
    for (const doc of docs) {
      if (!doc.exists) continue;
      const data = doc.data() as { name?: unknown } | undefined;
      const name = typeof data?.name === 'string' ? data.name : '';
      if (name) idToName.set(doc.id, name);
    }

    const events: EventRow[] = eventsSnap.docs.map((doc) => {
      const data = doc.data() as { type?: unknown; objectId?: unknown; createdAt?: unknown; meta?: unknown };
      const objectId = typeof data.objectId === 'string' ? data.objectId : null;
      return {
        id: doc.id,
        type: typeof data.type === 'string' ? data.type : '',
        objectId,
        objectName: objectId ? idToName.get(objectId) || null : null,
        createdAt: toIso(data.createdAt),
        meta: data.meta && typeof data.meta === 'object' ? (data.meta as Record<string, unknown>) : null,
      };
    });

    return res.status(200).json({ visitor, events });
  } catch (error) {
    console.error('visitor timeline error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load visitor';
    return res.status(500).json({ error: message });
  }
}
