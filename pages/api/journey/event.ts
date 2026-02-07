import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { parseCookies, serializeCookie } from '../../../lib/journey/cookies';
import { isJourneyEventType, type JourneyEventInput, type JourneyMeta } from '../../../lib/journey/eventTypes';
import { inferCountry, inferDevice, inferOs } from '../../../lib/journey/userAgent';
import { FieldValue } from 'firebase-admin/firestore';

const VISITOR_COOKIE = 'lc_vid';
const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

const typesRequiringObjectId = new Set([
  'VIEW_OBJECT',
  'OPEN_3D',
  'START_AR',
  'FINISH_AR',
  'AR_SNAPSHOT_CREATED',
  'SAVE_OBJECT',
  'REMOVE_OBJECT',
]);

function getOrCreateVisitorId(req: NextApiRequest): { visitorId: string; isNew: boolean } {
  const cookies = parseCookies(req.headers.cookie);
  const existing = cookies[VISITOR_COOKIE];
  if (existing && typeof existing === 'string' && existing.length >= 16) {
    return { visitorId: existing, isNew: false };
  }
  return { visitorId: randomUUID(), isNew: true };
}

function normalizeMeta(meta: unknown): JourneyMeta | undefined {
  if (!meta || typeof meta !== 'object') return undefined;
  const value = meta as {
    durationSec?: unknown;
    platform?: unknown;
    arSessionId?: unknown;
    snapshot?: unknown;
    handoff?: unknown;
  };
  const out: JourneyMeta = {};
  if (typeof value.durationSec === 'number' && Number.isFinite(value.durationSec) && value.durationSec >= 0) {
    out.durationSec = Math.round(value.durationSec);
  }
  if (value.platform === 'ios' || value.platform === 'android' || value.platform === 'web') {
    out.platform = value.platform;
  }
  if (typeof value.arSessionId === 'string') {
    const id = value.arSessionId.trim();
    if (id) out.arSessionId = id.slice(0, 120);
  }

  if (value.snapshot && typeof value.snapshot === 'object') {
    const s = value.snapshot as Record<string, unknown>;
    const sessionId = typeof s.sessionId === 'string' ? s.sessionId.trim().slice(0, 120) : '';
    const storagePath = typeof s.storagePath === 'string' ? s.storagePath.trim().slice(0, 300) : '';
    const partnerId = typeof s.partnerId === 'string' ? s.partnerId.trim().slice(0, 120) : undefined;
    const width = typeof s.width === 'number' && Number.isFinite(s.width) ? Math.round(s.width) : undefined;
    const height = typeof s.height === 'number' && Number.isFinite(s.height) ? Math.round(s.height) : undefined;
    const orientationRaw = s.orientation;
    const orientation =
      orientationRaw === 'portrait' || orientationRaw === 'landscape' ? orientationRaw : undefined;
    const url = typeof s.url === 'string' ? s.url.trim().slice(0, 500) : undefined;

    // New Fields
    const timestamp = typeof s.timestamp === 'number' ? s.timestamp : typeof s.timestamp === 'string' ? parseInt(s.timestamp, 10) : Date.now();
    const device = s.device === 'android' || s.device === 'ios' || s.device === 'web' ? s.device : undefined;
    const arMode = s.arMode === 'webxr' || s.arMode === 'quick-look' ? s.arMode : undefined;
    const modelId = typeof s.modelId === 'string' ? s.modelId.trim().slice(0, 120) : undefined;

    if (sessionId && storagePath) {
      out.snapshot = {
        sessionId,
        storagePath,
        ...(typeof width === 'number' && width > 0 ? { width } : {}),
        ...(typeof height === 'number' && height > 0 ? { height } : {}),
        ...(orientation ? { orientation } : {}),
        ...(partnerId ? { partnerId } : {}),
        ...(url ? { url } : {}),
        timestamp,
        ...(device ? { device } : {}),
        ...(arMode ? { arMode } : {}),
        ...(modelId ? { modelId } : {}),
      };
    };
  }


  if (value.handoff && typeof value.handoff === 'object') {
    const h = value.handoff as Record<string, unknown>;
    const reasonRaw = h.reason;
    const reason =
      reasonRaw === 'pricing' || reasonRaw === 'purchase' || reasonRaw === 'contact' ? reasonRaw : undefined;
    const objectId = typeof h.objectId === 'string' ? h.objectId : undefined;
    const objectName = typeof h.objectName === 'string' ? h.objectName.slice(0, 200) : undefined;
    const actions = Array.isArray(h.actions)
      ? (h.actions as unknown[])
        .filter((a): a is 'VIEW_3D' | 'AR_TRY' | 'SAVE' => a === 'VIEW_3D' || a === 'AR_TRY' || a === 'SAVE')
        .slice(0, 5)
      : [];
    const arDurationSecRaw = h.arDurationSec;
    const arDurationSec =
      typeof arDurationSecRaw === 'number' && Number.isFinite(arDurationSecRaw) && arDurationSecRaw >= 0
        ? Math.round(arDurationSecRaw)
        : arDurationSecRaw === null
          ? null
          : null;
    const lastQuestions = Array.isArray(h.lastQuestions)
      ? (h.lastQuestions as unknown[])
        .filter((q): q is string => typeof q === 'string')
        .map((q) => q.slice(0, 400))
        .slice(-3)
      : [];
    const timestamp = typeof h.timestamp === 'string' ? h.timestamp.slice(0, 40) : undefined;

    if (reason && timestamp) {
      out.handoff = {
        reason,
        ...(objectId ? { objectId } : {}),
        ...(objectName ? { objectName } : {}),
        actions,
        arDurationSec,
        lastQuestions,
        timestamp,
      };
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  const body = (req.body || {}) as Partial<JourneyEventInput> & Record<string, unknown>;
  if (!isJourneyEventType(body.type)) {
    return res.status(400).json({ error: 'Invalid event type' });
  }

  const objectId = typeof body.objectId === 'string' ? body.objectId.trim() : undefined;
  if (typesRequiringObjectId.has(body.type) && !objectId) {
    return res.status(400).json({ error: 'objectId is required for this event type' });
  }

  const meta = normalizeMeta(body.meta);

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  const { visitorId, isNew } = getOrCreateVisitorId(req);
  if (isNew) {
    res.setHeader(
      'Set-Cookie',
      serializeCookie(VISITOR_COOKIE, visitorId, {
        maxAgeSec: ONE_YEAR_SEC,
        httpOnly: true,
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      }),
    );
  }

  const device = inferDevice(req.headers['user-agent']);
  const os = inferOs(req.headers['user-agent']);
  const country = inferCountry(req.headers as unknown as Record<string, unknown>);

  const visitorRef = db.collection('visitors').doc(visitorId);
  const eventRef = db.collection('journeyEvents').doc();

  try {
    await db.runTransaction(async (t) => {
      const visitorSnap = await t.get(visitorRef);
      const existing = visitorSnap.exists ? visitorSnap.data() || {} : {};
      if (!visitorSnap.exists) {
        t.set(visitorRef, {
          firstSeenAt: FieldValue.serverTimestamp(),
          lastSeenAt: FieldValue.serverTimestamp(),
          device,
          os,
          ...(country ? { country } : {}),
        });
      } else {
        const data = visitorSnap.data() || {};
        const patch: Record<string, unknown> = {
          lastSeenAt: FieldValue.serverTimestamp(),
        };
        if (!data.device) patch.device = device;
        if (!data.os) patch.os = os;
        if (!data.country && country) patch.country = country;
        t.set(visitorRef, patch, { merge: true });
      }

      const eventDoc: Record<string, unknown> = {
        visitorId,
        type: body.type,
        createdAt: FieldValue.serverTimestamp(),
        ...(objectId ? { objectId } : {}),
        ...(meta ? { meta } : {}),
      };
      t.set(eventRef, eventDoc);

      const visitorPatch: Record<string, unknown> = {
        lastEventType: body.type,
        lastEventAt: FieldValue.serverTimestamp(),
        ...(objectId ? { lastObjectId: objectId } : {}),
      };

      if (body.type === 'VIEW_OBJECT') {
        visitorPatch.lastViewedAt = FieldValue.serverTimestamp();
        if (!('firstViewedAt' in existing)) visitorPatch.firstViewedAt = FieldValue.serverTimestamp();
      }

      if (body.type === 'OPEN_3D') {
        visitorPatch.last3dAt = FieldValue.serverTimestamp();
        if (!('first3dAt' in existing)) visitorPatch.first3dAt = FieldValue.serverTimestamp();
      }

      if (body.type === 'START_AR' || body.type === 'FINISH_AR') {
        visitorPatch.lastArAt = FieldValue.serverTimestamp();
        if (!('firstArAt' in existing)) visitorPatch.firstArAt = FieldValue.serverTimestamp();
      }

      if (body.type === 'SAVE_OBJECT' && objectId) {
        visitorPatch.savedObjectIds = FieldValue.arrayUnion(objectId);
        visitorPatch.lastSavedAt = FieldValue.serverTimestamp();
        if (!('firstSavedAt' in existing)) visitorPatch.firstSavedAt = FieldValue.serverTimestamp();
        visitorPatch.lastIntentAt = FieldValue.serverTimestamp();
      }

      if (body.type === 'REMOVE_OBJECT' && objectId) {
        visitorPatch.savedObjectIds = FieldValue.arrayRemove(objectId);
      }

      if (body.type === 'CONTACT_MANAGER') {
        visitorPatch.lastContactAt = FieldValue.serverTimestamp();
        if (!('firstContactAt' in existing)) visitorPatch.firstContactAt = FieldValue.serverTimestamp();
        visitorPatch.lastIntentAt = FieldValue.serverTimestamp();
      }

      if (body.type === 'HANDOFF_REQUESTED') {
        visitorPatch.lastHandoffAt = FieldValue.serverTimestamp();
        if (!('firstHandoffAt' in existing)) visitorPatch.firstHandoffAt = FieldValue.serverTimestamp();
        visitorPatch.lastIntentAt = FieldValue.serverTimestamp();
        if (meta?.handoff) {
          visitorPatch.lastHandoffReason = meta.handoff.reason;
          visitorPatch.lastHandoffObjectName = meta.handoff.objectName || null;
          visitorPatch.lastHandoffActions = meta.handoff.actions;
          visitorPatch.lastHandoffQuestions = meta.handoff.lastQuestions;
          visitorPatch.lastHandoffTimestamp = meta.handoff.timestamp;
        }
      }

      if (body.type === 'AR_SNAPSHOT_CREATED') {
        visitorPatch.lastSnapshotAt = FieldValue.serverTimestamp();
        visitorPatch.lastIntentAt = FieldValue.serverTimestamp();
        visitorPatch.snapshotCount = FieldValue.increment(1);
        if (!('firstSnapshotAt' in existing)) visitorPatch.firstSnapshotAt = FieldValue.serverTimestamp();
        const partnerId = meta?.snapshot?.partnerId;
        if (partnerId && !(typeof (existing as any).partnerId === 'string' && String((existing as any).partnerId).trim())) {
          visitorPatch.partnerId = partnerId;
        }
      }

      if (body.type === 'FINISH_AR' && meta?.durationSec != null) {
        visitorPatch.lastArDurationSec = meta.durationSec;
      }

      t.set(visitorRef, visitorPatch, { merge: true });
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('journey event error:', error);
    const message = error instanceof Error ? error.message : 'Failed to store event';
    return res.status(500).json({ error: message });
  }
}
