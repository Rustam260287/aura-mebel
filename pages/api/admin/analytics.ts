import type { NextApiRequest, NextApiResponse } from 'next';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { requireAdminSession } from '../../../lib/auth/admin-session';
import { inferVisitorStage, VISITOR_STAGE_LABEL, VISITOR_STAGE_ORDER } from '../../../lib/crm/stages';
import type { VisitorStage } from '../../../types';

const clampDays = (value: unknown, fallback: number) => {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(90, Math.max(1, Math.floor(n)));
};

const toMillis = (value: unknown): number | null => {
  if (!value) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const t = Date.parse(value);
    return Number.isFinite(t) ? t : null;
  }
  if (typeof value === 'object') {
    const maybe = value as { toDate?: () => Date };
    if (typeof maybe.toDate === 'function') return maybe.toDate().getTime();
  }
  return null;
};

const avg = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
};

type StageStats = {
  stage: VisitorStage;
  label: string;
  visitors: number;
  conversionToNext: number | null;
  avgSecondsToNext: number | null;
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
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const fromTs = Timestamp.fromDate(from);
  const toTs = Timestamp.fromDate(to);

  try {
    const visitorsSnap = await db
      .collection('visitors')
      .where('lastSeenAt', '>=', fromTs)
      .orderBy('lastSeenAt', 'desc')
      .limit(500)
      .select(
        'firstSeenAt',
        'firstViewedAt',
        'first3dAt',
        'firstArAt',
        'firstSavedAt',
        'firstSnapshotAt',
        'firstHandoffAt',
        'firstContactAt',
        'dialogueStartedAt',
        'dealClosedAt',
        'lastHandoffAt',
        'lastContactAt',
        'lastSnapshotAt',
        'snapshotCount',
        'savedObjectIds',
        'last3dAt',
        'lastArAt',
        'lastArDurationSec',
        'stageManual',
        'partnerId',
      )
      .get();

    const reachedCounts = new Map<VisitorStage, number>();
    const secondsToNext = new Map<VisitorStage, number[]>();
    const stageNowCounts = new Map<VisitorStage, number>();
    const partnerAgg = new Map<
      string,
      { visitors: number; reachedContact: number; reachedHandoff: number; avgStageIndexSum: number }
    >();

    for (const stage of VISITOR_STAGE_ORDER) {
      reachedCounts.set(stage, 0);
      stageNowCounts.set(stage, 0);
      secondsToNext.set(stage, []);
    }

    for (const doc of visitorsSnap.docs) {
      const v = doc.data() as Record<string, unknown>;
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

      const effective = stage.effective;
      stageNowCounts.set(effective, (stageNowCounts.get(effective) || 0) + 1);

      const idx = VISITOR_STAGE_ORDER.indexOf(effective);
      for (let i = 0; i <= idx; i += 1) {
        const key = VISITOR_STAGE_ORDER[i];
        reachedCounts.set(key, (reachedCounts.get(key) || 0) + 1);
      }

      const tView = toMillis(v.firstViewedAt) ?? toMillis(v.firstSeenAt);
      const t3dAr = toMillis(v.first3dAt) ?? toMillis(v.firstArAt);
      const tFixed = toMillis(v.firstSnapshotAt) ?? toMillis(v.firstSavedAt);
      const tHandoff = toMillis(v.firstHandoffAt) ?? toMillis(v.lastHandoffAt);
      const tContact = toMillis(v.firstContactAt) ?? toMillis(v.lastContactAt);
      const tDialogue = toMillis(v.dialogueStartedAt);
      const tDeal = toMillis(v.dealClosedAt);

      const stageStart: Partial<Record<VisitorStage, number | null>> = {
        VIEW: tView,
        THREE_D_AR: t3dAr,
        ACTIVE_TRY: toMillis(v.firstArAt),
        FIXED: tFixed,
        READY_TO_TALK: tHandoff,
        CONTACT_OBTAINED: tContact,
        DIALOGUE: tDialogue,
        DEAL_CLOSED: tDeal,
      };

      for (let i = 0; i < VISITOR_STAGE_ORDER.length - 1; i += 1) {
        const aStage = VISITOR_STAGE_ORDER[i];
        const bStage = VISITOR_STAGE_ORDER[i + 1];
        const a = stageStart[aStage];
        const b = stageStart[bStage];
        if (a == null || b == null) continue;
        if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) continue;
        const diffSec = Math.round((b - a) / 1000);
        if (diffSec >= 0) secondsToNext.get(aStage)?.push(diffSec);
      }

      const partnerId = typeof v.partnerId === 'string' ? v.partnerId.trim() : '';
      if (partnerId) {
        const p = partnerAgg.get(partnerId) || { visitors: 0, reachedContact: 0, reachedHandoff: 0, avgStageIndexSum: 0 };
        p.visitors += 1;
        if (idx >= VISITOR_STAGE_ORDER.indexOf('READY_TO_TALK')) p.reachedHandoff += 1;
        if (idx >= VISITOR_STAGE_ORDER.indexOf('CONTACT_OBTAINED')) p.reachedContact += 1;
        p.avgStageIndexSum += idx;
        partnerAgg.set(partnerId, p);
      }
    }

    const stages: StageStats[] = VISITOR_STAGE_ORDER.map((stageKey, i) => {
      const visitors = reachedCounts.get(stageKey) || 0;
      const next = i < VISITOR_STAGE_ORDER.length - 1 ? reachedCounts.get(VISITOR_STAGE_ORDER[i + 1]) || 0 : null;
      const conversionToNext = next == null || visitors === 0 ? null : Math.round((next / visitors) * 1000) / 1000;
      const avgSecondsToNext = i < VISITOR_STAGE_ORDER.length - 1 ? avg(secondsToNext.get(stageKey) || []) : null;
      return {
        stage: stageKey,
        label: VISITOR_STAGE_LABEL[stageKey],
        visitors,
        conversionToNext,
        avgSecondsToNext,
      };
    });

    const partnerStats = Array.from(partnerAgg.entries())
      .map(([partnerId, p]) => {
        const avgStageIndex = p.visitors > 0 ? p.avgStageIndexSum / p.visitors : 0;
        return {
          partnerId,
          visitors: p.visitors,
          reachedHandoff: p.reachedHandoff,
          reachedContact: p.reachedContact,
          avgStageIndex: Math.round(avgStageIndex * 10) / 10,
        };
      })
      .sort((a, b) => b.reachedContact - a.reachedContact || b.visitors - a.visitors)
      .slice(0, 30);

    const eventsSnap = await db
      .collection('journeyEvents')
      .where('createdAt', '>=', fromTs)
      .where('createdAt', '<=', toTs)
      .orderBy('createdAt', 'asc')
      .select('type', 'objectId', 'meta', 'visitorId')
      .get();

    const objects = new Map<
      string,
      {
        objectId: string;
        viewed: number;
        saved: number;
        snapshots: number;
        arDurationSec: number;
        uniqueVisitors: Set<string>;
        viewTimes: number[];
        returnVisitors: Set<string>;
      }
    >();

    // Track visitors per object for return rate calculation
    const objectVisitorFirstSeen = new Map<string, Map<string, number>>();

    const ensureObject = (objectId: string) => {
      const existing = objects.get(objectId);
      if (existing) return existing;
      const next = {
        objectId,
        viewed: 0,
        saved: 0,
        snapshots: 0,
        arDurationSec: 0,
        uniqueVisitors: new Set<string>(),
        viewTimes: [] as number[],
        returnVisitors: new Set<string>(),
      };
      objects.set(objectId, next);
      objectVisitorFirstSeen.set(objectId, new Map());
      return next;
    };

    for (const doc of eventsSnap.docs) {
      const d = doc.data() as { type?: unknown; objectId?: unknown; meta?: any; visitorId?: unknown };
      const type = typeof d.type === 'string' ? d.type : '';
      const objectId = typeof d.objectId === 'string' ? d.objectId : '';
      const visitorId = typeof d.visitorId === 'string' ? d.visitorId : (d.meta?.visitorId || '');
      if (!objectId) continue;

      const row = ensureObject(objectId);

      if (type === 'VIEW_OBJECT') {
        row.viewed += 1;

        // Track unique visitors
        if (visitorId) {
          const firstSeenMap = objectVisitorFirstSeen.get(objectId)!;
          if (!firstSeenMap.has(visitorId)) {
            firstSeenMap.set(visitorId, Date.now());
            row.uniqueVisitors.add(visitorId);
          } else {
            row.returnVisitors.add(visitorId);
          }
        }

        // Track view time
        const viewTimeMs = d.meta?.viewTimeMs;
        if (typeof viewTimeMs === 'number' && viewTimeMs > 0) {
          row.viewTimes.push(Math.round(viewTimeMs / 1000));
        }
      }

      if (type === 'SAVE_OBJECT') row.saved += 1;
      if (type === 'AR_SNAPSHOT_CREATED') row.snapshots += 1;
      if (type === 'FINISH_AR') {
        const duration = typeof d.meta?.durationSec === 'number' ? d.meta.durationSec : null;
        if (duration != null && Number.isFinite(duration) && duration >= 0) row.arDurationSec += Math.round(duration);
      }
    }

    // Helper for median
    const median = (arr: number[]): number | null => {
      if (arr.length === 0) return null;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    };

    const topObjects = Array.from(objects.values())
      .map((o) => ({
        objectId: o.objectId,
        viewed: o.viewed,
        saved: o.saved,
        snapshots: o.snapshots,
        arDurationSec: o.arDurationSec,
        uniqueVisitors: o.uniqueVisitors.size,
        avgViewTimeSec: o.viewTimes.length > 0 ? Math.round(o.viewTimes.reduce((a, b) => a + b, 0) / o.viewTimes.length) : null,
        medianViewTimeSec: median(o.viewTimes),
        returnVisitorRate: o.uniqueVisitors.size > 0 ? Math.round((o.returnVisitors.size / o.uniqueVisitors.size) * 100) : 0,
      }))
      .sort((a, b) => b.uniqueVisitors - a.uniqueVisitors || b.saved - a.saved || b.viewed - a.viewed)
      .slice(0, 20);

    return res.status(200).json({
      period: { from: from.toISOString(), to: to.toISOString(), days },
      stages,
      topObjects,
      partners: partnerStats,
      stageNow: Object.fromEntries(Array.from(stageNowCounts.entries())),
    });
  } catch (error) {
    console.error('admin analytics error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load analytics';
    return res.status(500).json({ error: message });
  }
}

