import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, getAdminStorage } from '../../../../lib/firebaseAdmin';
import { requireAdminSession } from '../../../../lib/auth/admin-session';
import { COLLECTIONS } from '../../../../lib/db/collections';
import { inferVisitorStage } from '../../../../lib/crm/stages';
import type { VisitorStage } from '../../../../types';

const toIso = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null;
  const maybe = value as { toDate?: () => Date };
  if (typeof maybe.toDate !== 'function') return null;
  return maybe.toDate().toISOString();
};

type VisitorDetails = {
  id: string;
  stage: {
    effective: VisitorStage;
    auto: VisitorStage;
    manual: VisitorStage | null;
    manualAt: string | null;
    manualBy: { uid: string; email: string | null } | null;
    reasons: string[];
  };
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  device: 'mobile' | 'desktop' | null;
  os: 'ios' | 'android' | 'other' | null;
  country: string | null;
  partnerId: string | null;
  savedObjectIds: string[];
  savedCount: number;
  snapshotCount: number;
  hasAr: boolean;
  lastObjectId: string | null;
  lastEventType: string | null;
  lastEventAt: string | null;
  lastIntentAt: string | null;
  lastArDurationSec: number | null;
  lastHandoffAt: string | null;
  lastHandoffReason: 'pricing' | 'purchase' | 'contact' | null;
  lastHandoffActions: Array<'VIEW_3D' | 'AR_TRY' | 'SAVE'>;
  lastHandoffQuestions: string[];
};

type EventRow = {
  id: string;
  type: string;
  objectId: string | null;
  objectName: string | null;
  createdAt: string | null;
  meta: Record<string, unknown> | null;
};

type NoteRow = {
  id: string;
  text: string;
  createdAt: string | null;
  author: { uid: string; email: string | null } | null;
};

type ObjectInterestRow = {
  objectId: string;
  objectName: string | null;
  viewed: number;
  opened3d: number;
  arSessions: number;
  arDurationSec: number;
  snapshots: number;
  saved: boolean;
};

const normalizeActor = (value: unknown): VisitorDetails['stage']['manualBy'] => {
  if (!value || typeof value !== 'object') return null;
  const v = value as { uid?: unknown; email?: unknown };
  const uid = typeof v.uid === 'string' ? v.uid.trim() : '';
  const email = typeof v.email === 'string' && v.email.trim() ? v.email.trim() : null;
  if (!uid) return null;
  return { uid, email };
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

const normalizeHandoffReason = (value: unknown): VisitorDetails['lastHandoffReason'] => {
  if (value === 'pricing' || value === 'purchase' || value === 'contact') return value;
  return null;
};

const normalizeHandoffActions = (value: unknown): VisitorDetails['lastHandoffActions'] => {
  if (!Array.isArray(value)) return [];
  return (value as unknown[])
    .filter((a): a is 'VIEW_3D' | 'AR_TRY' | 'SAVE' => a === 'VIEW_3D' || a === 'AR_TRY' || a === 'SAVE')
    .slice(0, 5);
};

const normalizeQuestions = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return (value as unknown[])
    .filter((q): q is string => typeof q === 'string')
    .map((q) => q.slice(0, 400))
    .slice(-6);
};

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
    const visitorDoc = await db.collection('visitors').doc(visitorId).get();
    if (!visitorDoc.exists) return res.status(404).json({ error: 'Visitor not found' });

    const v = visitorDoc.data() as Record<string, unknown>;
    const savedObjectIds = Array.isArray(v.savedObjectIds)
      ? v.savedObjectIds.filter((id) => typeof id === 'string' && id.trim())
      : [];
    const savedCount = savedObjectIds.length;
    const snapshotCount =
      typeof v.snapshotCount === 'number' && Number.isFinite(v.snapshotCount) && v.snapshotCount > 0
        ? Math.round(v.snapshotCount)
        : 0;

    const stage = inferVisitorStage({
      stageManual: v.stageManual,
      lastContactAt: v.lastContactAt,
      lastHandoffAt: v.lastHandoffAt,
      lastSnapshotAt: v.lastSnapshotAt,
      snapshotCount: v.snapshotCount,
      savedObjectIds: v.savedObjectIds,
      lastArAt: v.lastArAt,
      firstArAt: v.firstArAt,
      lastArDurationSec: v.lastArDurationSec,
      last3dAt: v.last3dAt,
      dialogueStartedAt: v.dialogueStartedAt,
      dealClosedAt: v.dealClosedAt,
    });

    const hasAr = Boolean(v.lastArAt || v.firstArAt || typeof v.lastArDurationSec === 'number');
    const lastArDurationSec =
      typeof v.lastArDurationSec === 'number' && Number.isFinite(v.lastArDurationSec) ? v.lastArDurationSec : null;

    const visitor: VisitorDetails = {
      id: visitorDoc.id,
      stage: {
        effective: stage.effective,
        auto: stage.auto,
        manual: stage.manual,
        manualAt: toIso(v.stageManualAt),
        manualBy: normalizeActor(v.stageManualBy),
        reasons: stage.reasons,
      },
      firstSeenAt: toIso(v.firstSeenAt),
      lastSeenAt: toIso(v.lastSeenAt),
      device: v.device === 'mobile' || v.device === 'desktop' ? v.device : null,
      os: v.os === 'ios' || v.os === 'android' || v.os === 'other' ? v.os : null,
      country: typeof v.country === 'string' ? v.country : null,
      partnerId: typeof v.partnerId === 'string' ? v.partnerId : null,
      savedObjectIds,
      savedCount,
      snapshotCount,
      hasAr,
      lastObjectId: typeof v.lastObjectId === 'string' ? v.lastObjectId : null,
      lastEventType: typeof v.lastEventType === 'string' ? v.lastEventType : null,
      lastEventAt: toIso(v.lastEventAt),
      lastIntentAt: toIso(v.lastIntentAt),
      lastArDurationSec,
      lastHandoffAt: toIso(v.lastHandoffAt),
      lastHandoffReason: normalizeHandoffReason(v.lastHandoffReason),
      lastHandoffActions: normalizeHandoffActions(v.lastHandoffActions),
      lastHandoffQuestions: normalizeQuestions(v.lastHandoffQuestions),
    };

    const eventsSnap = await db
      .collection('journeyEvents')
      .where('visitorId', '==', visitorId)
      .orderBy('createdAt', 'asc')
      .limit(600)
      .get();

    const objectIds = new Set<string>();
    for (const doc of eventsSnap.docs) {
      const data = doc.data() as { objectId?: unknown };
      const objectId = typeof data.objectId === 'string' ? data.objectId : '';
      if (objectId) objectIds.add(objectId);
    }
    for (const id of savedObjectIds) objectIds.add(id);
    if (visitor.lastObjectId) objectIds.add(visitor.lastObjectId);

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

    const interest = new Map<string, ObjectInterestRow>();
    const ensure = (objectId: string): ObjectInterestRow => {
      const existing = interest.get(objectId);
      if (existing) return existing;
      const row: ObjectInterestRow = {
        objectId,
        objectName: idToName.get(objectId) || null,
        viewed: 0,
        opened3d: 0,
        arSessions: 0,
        arDurationSec: 0,
        snapshots: 0,
        saved: savedObjectIds.includes(objectId),
      };
      interest.set(objectId, row);
      return row;
    };

    for (const evt of events) {
      if (!evt.objectId) continue;
      const row = ensure(evt.objectId);
      if (evt.type === 'VIEW_OBJECT') row.viewed += 1;
      if (evt.type === 'OPEN_3D') row.opened3d += 1;
      if (evt.type === 'START_AR') row.arSessions += 1;
      if (evt.type === 'FINISH_AR') {
        const duration = typeof evt.meta?.durationSec === 'number' ? evt.meta.durationSec : null;
        if (duration != null && Number.isFinite(duration) && duration >= 0) row.arDurationSec += Math.round(duration);
      }
      if (evt.type === 'AR_SNAPSHOT_CREATED') row.snapshots += 1;
    }

    const objects: ObjectInterestRow[] = Array.from(interest.values())
      .sort((a, b) => {
        const scoreA = a.arDurationSec + a.snapshots * 20 + a.opened3d * 5 + a.viewed;
        const scoreB = b.arDurationSec + b.snapshots * 20 + b.opened3d * 5 + b.viewed;
        return scoreB - scoreA;
      })
      .slice(0, 20);

    const notesSnap = await db
      .collection('visitors')
      .doc(visitorId)
      .collection('notes')
      .orderBy('createdAt', 'desc')
      .limit(60)
      .get()
      .catch(() => null);

    const notes: NoteRow[] = notesSnap
      ? notesSnap.docs.map((doc) => {
          const d = doc.data() as { text?: unknown; createdAt?: unknown; author?: unknown };
          const text = typeof d.text === 'string' ? d.text : '';
          const author = normalizeActor(d.author);
          return { id: doc.id, text, createdAt: toIso(d.createdAt), author };
        })
      : [];

    return res.status(200).json({ visitor, events, objects, notes });
  } catch (error) {
    console.error('admin visitor detail error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load visitor';
    return res.status(500).json({ error: message });
  }
}

