import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, getAdminStorage } from '../../../../../lib/firebaseAdmin';
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

const getSnapshotPath = (meta: Record<string, unknown> | null): string | null => {
  if (!meta) return null;
  const snapshot = meta.snapshot;
  if (!snapshot || typeof snapshot !== 'object') return null;
  const path = (snapshot as any).storagePath;
  if (typeof path !== 'string') return null;
  const trimmed = path.trim();
  return trimmed ? trimmed : null;
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

    const storage = getAdminStorage();
    if (storage) {
      const bucket = storage.bucket();
      const snapshotEvents = events.filter((e) => e.type === 'AR_SNAPSHOT_CREATED' && getSnapshotPath(e.meta));
      await Promise.all(
        snapshotEvents.map(async (evt) => {
          const meta = evt.meta;
          if (!meta) return;
          const snapshot = meta.snapshot;
          if (!snapshot || typeof snapshot !== 'object') return;
          const storagePath = getSnapshotPath(meta);
          if (!storagePath) return;
          try {
            const [url] = await bucket.file(storagePath).getSignedUrl({
              version: 'v4',
              action: 'read',
              expires: Date.now() + 60 * 60 * 1000,
            });
            (snapshot as any).url = url;
          } catch (e) {
            console.warn('Failed to sign snapshot URL', storagePath, e);
          }
        }),
      );
    }

    return res.status(200).json({ visitor, events });
  } catch (error) {
    console.error('visitor timeline error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load visitor';
    return res.status(500).json({ error: message });
  }
}
