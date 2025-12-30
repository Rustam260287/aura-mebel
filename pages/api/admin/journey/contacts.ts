import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { requireAdminSession } from '../../../../lib/auth/admin-session';
import { Timestamp } from 'firebase-admin/firestore';

const clampDays = (value: unknown, fallback: number) => {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(365, Math.max(1, Math.floor(n)));
};

const toIso = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null;
  const maybe = value as { toDate?: () => Date };
  if (typeof maybe.toDate !== 'function') return null;
  return maybe.toDate().toISOString();
};

type ContactRow = {
  id: string;
  lastHandoffAt: string | null;
  lastHandoffReason: 'pricing' | 'purchase' | 'contact' | null;
  lastObjectId: string | null;
  lastObjectName: string | null;
  lastActions: Array<'VIEW_3D' | 'AR_TRY' | 'SAVE'>;
  lastQuestions: string[];
  lastArDurationSec: number | null;
  savedCount: number;
  lastSeenAt: string | null;
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

  try {
    const snap = await db
      .collection('visitors')
      .where('lastHandoffAt', '>=', fromTs)
      .orderBy('lastHandoffAt', 'desc')
      .limit(200)
      .select(
        'lastHandoffAt',
        'lastHandoffReason',
        'lastObjectId',
        'lastHandoffObjectName',
        'lastHandoffActions',
        'lastHandoffQuestions',
        'lastArDurationSec',
        'savedObjectIds',
        'lastSeenAt',
      )
      .get();

    const rows: ContactRow[] = snap.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const savedObjectIds = Array.isArray(data.savedObjectIds)
        ? data.savedObjectIds.filter((v) => typeof v === 'string')
        : [];

      const rawReason = data.lastHandoffReason;
      const lastHandoffReason: ContactRow['lastHandoffReason'] =
        rawReason === 'pricing' || rawReason === 'purchase' || rawReason === 'contact' ? rawReason : null;

      const rawActions = Array.isArray(data.lastHandoffActions) ? data.lastHandoffActions : [];
      const lastActions = rawActions
        .filter((a): a is 'VIEW_3D' | 'AR_TRY' | 'SAVE' => a === 'VIEW_3D' || a === 'AR_TRY' || a === 'SAVE')
        .slice(0, 5);

      const rawQuestions = Array.isArray(data.lastHandoffQuestions) ? data.lastHandoffQuestions : [];
      const lastQuestions = rawQuestions
        .filter((q): q is string => typeof q === 'string')
        .map((q) => q.slice(0, 400))
        .slice(-3);

      const rawArDuration = data.lastArDurationSec;
      const lastArDurationSec =
        typeof rawArDuration === 'number' && Number.isFinite(rawArDuration) && rawArDuration >= 0
          ? Math.round(rawArDuration)
          : null;

      return {
        id: doc.id,
        lastHandoffAt: toIso(data.lastHandoffAt),
        lastHandoffReason,
        lastObjectId: typeof data.lastObjectId === 'string' ? data.lastObjectId : null,
        lastObjectName: typeof data.lastHandoffObjectName === 'string' ? data.lastHandoffObjectName : null,
        lastActions,
        lastQuestions,
        lastArDurationSec,
        savedCount: savedObjectIds.length,
        lastSeenAt: toIso(data.lastSeenAt),
      };
    });

    return res.status(200).json({
      period: { from: from.toISOString(), to: to.toISOString(), days },
      contacts: rows,
    });
  } catch (error) {
    console.error('contacts error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load contacts';
    return res.status(500).json({ error: message });
  }
}
