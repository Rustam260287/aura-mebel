import type { NextApiRequest, NextApiResponse } from 'next';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../../../lib/firebaseAdmin';
import { requireAdminSession } from '../../../../../lib/auth/admin-session';
import { normalizeVisitorStage, VISITOR_STAGE_LABEL } from '../../../../../lib/crm/stages';

type StageRequest = {
  stage?: string | null;
};

const isAutoStage = (value: unknown): boolean => {
  if (value == null) return true;
  if (typeof value !== 'string') return false;
  const v = value.trim().toLowerCase();
  return v === '' || v === 'auto' || v === 'automatic' || v === 'null' || v === 'reset';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireAdminSession(req, res);
  if (!session) return;

  const visitorId = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  if (!visitorId) return res.status(400).json({ error: 'Invalid visitor id' });

  const body = (req.body || {}) as StageRequest;
  const wantsAuto = isAutoStage(body.stage);
  const nextStage = wantsAuto ? null : normalizeVisitorStage(body.stage);
  if (!wantsAuto && !nextStage) return res.status(400).json({ error: 'Invalid stage' });

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  const visitorRef = db.collection('visitors').doc(visitorId);

  try {
    await db.runTransaction(async (t) => {
      const snap = await t.get(visitorRef);
      if (!snap.exists) throw new Error('Visitor not found');
      const data = snap.data() || {};
      const prevStage = normalizeVisitorStage((data as any).stageManual);

      const actor = {
        uid: session.uid,
        ...(session.email ? { email: session.email } : {}),
      };

      const patch: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (!nextStage) {
        patch.stageManual = FieldValue.delete();
        patch.stageManualAt = FieldValue.delete();
        patch.stageManualBy = FieldValue.delete();
      } else {
        patch.stageManual = nextStage;
        patch.stageManualAt = FieldValue.serverTimestamp();
        patch.stageManualBy = actor;

        if (nextStage === 'DIALOGUE' && !(data as any).dialogueStartedAt) {
          patch.dialogueStartedAt = FieldValue.serverTimestamp();
        }
        if (nextStage === 'DEAL_CLOSED' && !(data as any).dealClosedAt) {
          patch.dealClosedAt = FieldValue.serverTimestamp();
        }
      }

      t.set(visitorRef, patch, { merge: true });

      const fromLabel = prevStage ? VISITOR_STAGE_LABEL[prevStage] : null;
      const toLabel = nextStage ? VISITOR_STAGE_LABEL[nextStage] : null;

      const stageEventRef = db.collection('journeyEvents').doc();
      t.set(stageEventRef, {
        visitorId,
        type: 'STAGE_CHANGED',
        createdAt: FieldValue.serverTimestamp(),
        meta: {
          from: prevStage,
          to: nextStage,
          ...(fromLabel ? { fromLabel } : {}),
          ...(toLabel ? { toLabel } : {}),
          actor,
        },
      });

      if (nextStage === 'DEAL_CLOSED') {
        const dealEventRef = db.collection('journeyEvents').doc();
        t.set(dealEventRef, {
          visitorId,
          type: 'DEAL_CLOSED',
          createdAt: FieldValue.serverTimestamp(),
          meta: { actor },
        });
      }
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update stage';
    const status = message === 'Visitor not found' ? 404 : 500;
    return res.status(status).json({ error: message });
  }
}

