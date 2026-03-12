import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../../lib/firebaseAdmin';
import { requireAdminSession } from '../../../../../lib/auth/admin-session';
import { COLLECTIONS } from '../../../../../lib/db/collections';
import { parseStoredHandoffReason, type StoredHandoffReason } from '../../../../../lib/journey/handoff';

const toIso = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null;
  const maybe = value as { toDate?: () => Date };
  if (typeof maybe.toDate !== 'function') return null;
  return maybe.toDate().toISOString();
};

type HandoffDetailResponse = {
  visitorId: string;
  handoff: {
    at: string | null;
    reason: StoredHandoffReason | null;
    objectId: string | null;
    objectName: string | null;
    actions: Array<'VIEW_3D' | 'AR_TRY' | 'SAVE'>;
    arDurationSec: number | null;
    lastQuestions: string[];
    timestamp: string | null;
  };
  path: Array<{
    type: string;
    at: string | null;
    objectId: string | null;
    objectName: string | null;
    meta: { durationSec?: number } | null;
  }>;
};

const allowedPathTypes = new Set([
  'VIEW_OBJECT',
  'OPEN_3D',
  'START_AR',
  'FINISH_AR',
  'SAVE_OBJECT',
  'REMOVE_OBJECT',
  'HANDOFF_REQUESTED',
]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireAdminSession(req, res);
  if (!session) return;

  const visitorId = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  if (!visitorId) return res.status(400).json({ error: 'Invalid visitor id' });

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  try {
    const visitorDoc = await db
      .collection('visitors')
      .doc(visitorId)
      .get();

    if (!visitorDoc.exists) return res.status(404).json({ error: 'Visitor not found' });

    const v = visitorDoc.data() as Record<string, unknown>;
    const handoffAt = toIso(v.lastHandoffAt);
    if (!handoffAt) return res.status(404).json({ error: 'No hand-off for this visitor' });

    const reason: HandoffDetailResponse['handoff']['reason'] = parseStoredHandoffReason(v.lastHandoffReason);

    const objectId = typeof v.lastObjectId === 'string' ? v.lastObjectId : null;
    const objectName = typeof v.lastHandoffObjectName === 'string' ? v.lastHandoffObjectName : null;
    const actions = Array.isArray(v.lastHandoffActions)
      ? (v.lastHandoffActions as unknown[])
          .filter((a): a is 'VIEW_3D' | 'AR_TRY' | 'SAVE' => a === 'VIEW_3D' || a === 'AR_TRY' || a === 'SAVE')
          .slice(0, 5)
      : [];
    const lastQuestions = Array.isArray(v.lastHandoffQuestions)
      ? (v.lastHandoffQuestions as unknown[])
          .filter((q): q is string => typeof q === 'string')
          .map((q) => q.slice(0, 400))
          .slice(-3)
      : [];
    const arDurationSecRaw = v.lastArDurationSec;
    const arDurationSec =
      typeof arDurationSecRaw === 'number' && Number.isFinite(arDurationSecRaw) && arDurationSecRaw >= 0
        ? Math.round(arDurationSecRaw)
        : null;
    const timestamp = typeof v.lastHandoffTimestamp === 'string' ? v.lastHandoffTimestamp : null;

    const eventsSnap = await db
      .collection('journeyEvents')
      .where('visitorId', '==', visitorId)
      .orderBy('createdAt', 'desc')
      .limit(40)
      .select('type', 'objectId', 'createdAt', 'meta')
      .get();

    const rawEvents = eventsSnap.docs
      .map((doc) => {
        const d = doc.data() as { type?: unknown; objectId?: unknown; createdAt?: unknown; meta?: unknown };
        const type = typeof d.type === 'string' ? d.type : '';
        if (!allowedPathTypes.has(type)) return null;
        const objectId = typeof d.objectId === 'string' ? d.objectId : null;
        const createdAt = toIso(d.createdAt);
        const meta = d.meta && typeof d.meta === 'object' ? (d.meta as Record<string, unknown>) : null;
        const durationSec = typeof meta?.durationSec === 'number' ? meta.durationSec : undefined;
        return {
          type,
          at: createdAt,
          objectId,
          meta: durationSec != null ? { durationSec } : null,
        };
      })
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .reverse();

    const objectIds = new Set<string>();
    if (objectId) objectIds.add(objectId);
    for (const e of rawEvents) if (e.objectId) objectIds.add(e.objectId);

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

    const path: HandoffDetailResponse['path'] = rawEvents.map((e) => ({
      type: e.type,
      at: e.at,
      objectId: e.objectId,
      objectName: e.objectId ? idToName.get(e.objectId) || null : null,
      meta: e.meta,
    }));

    const response: HandoffDetailResponse = {
      visitorId,
      handoff: {
        at: handoffAt,
        reason,
        objectId,
        objectName: objectName || (objectId ? idToName.get(objectId) || null : null),
        actions,
        arDurationSec,
        lastQuestions,
        timestamp,
      },
      path,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('handoff detail error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load handoff';
    return res.status(500).json({ error: message });
  }
}
