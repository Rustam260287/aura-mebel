import type { NextApiRequest, NextApiResponse } from 'next';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireAdminSession } from '../../../../lib/auth/admin-session';
import { COLLECTIONS } from '../../../../lib/db/collections';
import { inferVisitorStage } from '../../../../lib/crm/stages';
import type { VisitorStage } from '../../../../types';

const clampDays = (value: unknown, fallback: number) => {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(365, Math.max(1, Math.floor(n)));
};

const clampLimit = (value: unknown, fallback: number) => {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(500, Math.max(50, Math.floor(n)));
};

const toIso = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null;
  const maybe = value as { toDate?: () => Date };
  if (typeof maybe.toDate !== 'function') return null;
  return maybe.toDate().toISOString();
};

type VisitorRow = {
  id: string;
  stage: VisitorStage;
  stageAuto: VisitorStage;
  stageManual: VisitorStage | null;
  stageManualAt: string | null;
  stageManualBy: { uid: string; email: string | null } | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  device: 'mobile' | 'desktop' | null;
  os: 'ios' | 'android' | 'other' | null;
  country: string | null;
  partnerId: string | null;
  lastObjectId: string | null;
  lastObjectName: string | null;
  lastEventType: string | null;
  lastEventAt: string | null;
  lastIntentAt: string | null;
  savedCount: number;
  snapshotCount: number;
  hasAr: boolean;
};

const normalizeActor = (value: unknown): VisitorRow['stageManualBy'] => {
  if (!value || typeof value !== 'object') return null;
  const v = value as { uid?: unknown; email?: unknown };
  const uid = typeof v.uid === 'string' ? v.uid.trim() : '';
  const email = typeof v.email === 'string' && v.email.trim() ? v.email.trim() : null;
  if (!uid) return null;
  return { uid, email };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireAdminSession(req, res);
  if (!session) return;

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  const days = clampDays(req.query.days, 30);
  const limit = clampLimit(req.query.limit, 250);
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const fromTs = Timestamp.fromDate(from);

  try {
    const snap = await db
      .collection('visitors')
      .where('lastSeenAt', '>=', fromTs)
      .orderBy('lastSeenAt', 'desc')
      .limit(limit)
      .select(
        'firstSeenAt',
        'lastSeenAt',
        'device',
        'os',
        'country',
        'partnerId',
        'lastObjectId',
        'lastEventType',
        'lastEventAt',
        'lastIntentAt',
        'savedObjectIds',
        'snapshotCount',
        'lastSnapshotAt',
        'last3dAt',
        'lastArAt',
        'firstArAt',
        'lastArDurationSec',
        'lastHandoffAt',
        'lastContactAt',
        'stageManual',
        'stageManualAt',
        'stageManualBy',
        'dialogueStartedAt',
        'dealClosedAt',
      )
      .get();

    const rows: VisitorRow[] = snap.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const savedObjectIds = Array.isArray(data.savedObjectIds)
        ? data.savedObjectIds.filter((v) => typeof v === 'string' && v.trim())
        : [];
      const savedCount = savedObjectIds.length;

      const snapshotCount =
        typeof data.snapshotCount === 'number' && Number.isFinite(data.snapshotCount) && data.snapshotCount > 0
          ? Math.round(data.snapshotCount)
          : 0;

      const stage = inferVisitorStage({
        stageManual: data.stageManual,
        lastContactAt: data.lastContactAt,
        lastHandoffAt: data.lastHandoffAt,
        lastSnapshotAt: data.lastSnapshotAt,
        snapshotCount: data.snapshotCount,
        savedObjectIds: data.savedObjectIds,
        lastArAt: data.lastArAt,
        firstArAt: data.firstArAt,
        lastArDurationSec: data.lastArDurationSec,
        last3dAt: data.last3dAt,
        dialogueStartedAt: data.dialogueStartedAt,
        dealClosedAt: data.dealClosedAt,
      });

      const hasAr = Boolean(data.lastArAt || data.firstArAt || typeof data.lastArDurationSec === 'number');

      return {
        id: doc.id,
        stage: stage.effective,
        stageAuto: stage.auto,
        stageManual: stage.manual,
        stageManualAt: toIso(data.stageManualAt),
        stageManualBy: normalizeActor(data.stageManualBy),
        firstSeenAt: toIso(data.firstSeenAt),
        lastSeenAt: toIso(data.lastSeenAt),
        device: data.device === 'mobile' || data.device === 'desktop' ? data.device : null,
        os: data.os === 'ios' || data.os === 'android' || data.os === 'other' ? data.os : null,
        country: typeof data.country === 'string' ? data.country : null,
        partnerId: typeof data.partnerId === 'string' ? data.partnerId : null,
        lastObjectId: typeof data.lastObjectId === 'string' ? data.lastObjectId : null,
        lastObjectName: null,
        lastEventType: typeof data.lastEventType === 'string' ? data.lastEventType : null,
        lastEventAt: toIso(data.lastEventAt),
        lastIntentAt: toIso(data.lastIntentAt),
        savedCount,
        snapshotCount,
        hasAr,
      };
    });

    const objectIds = Array.from(new Set(rows.map((r) => r.lastObjectId).filter((v): v is string => Boolean(v))));
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

    for (const row of rows) {
      if (row.lastObjectId) row.lastObjectName = idToName.get(row.lastObjectId) || null;
    }

    return res.status(200).json({
      period: { from: from.toISOString(), to: to.toISOString(), days, limit },
      visitors: rows,
    });
  } catch (error) {
    console.error('admin visitors error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load visitors';
    return res.status(500).json({ error: message });
  }
}

