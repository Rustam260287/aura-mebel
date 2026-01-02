import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { getAdminDb, getAdminStorage } from '../../../lib/firebaseAdmin';
import { inferCountry, inferDevice, inferOs } from '../../../lib/journey/userAgent';
import { parseCookies, serializeCookie } from '../../../lib/journey/cookies';
import { FieldValue } from 'firebase-admin/firestore';

type FinalizeSnapshotRequest = {
  filePath?: string;
  sessionId?: string;
  objectId?: string;
  partnerId?: string;
  width?: number;
  height?: number;
  orientation?: 'portrait' | 'landscape';
};

const VISITOR_COOKIE = 'lc_vid';
const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

function getOrCreateVisitorId(req: NextApiRequest): { visitorId: string; isNew: boolean } {
  const cookies = parseCookies(req.headers.cookie);
  const existing = cookies[VISITOR_COOKIE];
  if (existing && typeof existing === 'string' && existing.length >= 16) {
    return { visitorId: existing, isNew: false };
  }
  return { visitorId: randomUUID(), isNew: true };
}

const normalizeSessionId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[a-zA-Z0-9_-]{8,160}$/.test(trimmed)) return null;
  return trimmed;
};

const normalizeObjectId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 120);
};

const normalizePartnerId = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, 120);
};

const clampInt = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const n = Math.round(value);
  if (n <= 0) return undefined;
  return Math.min(9999, Math.max(1, n));
};

const inferPlatform = (userAgent: string | undefined): 'ios' | 'android' | 'web' => {
  const os = inferOs(userAgent);
  if (os === 'ios') return 'ios';
  if (os === 'android') return 'android';
  return 'web';
};

const isAllowedPath = (filePath: string, sessionId: string): boolean => {
  if (!filePath.startsWith(`snapshots/session_${sessionId}/snapshot_`)) return false;
  if (!filePath.endsWith('.jpg')) return false;
  if (filePath.includes('..')) return false;
  if (filePath.includes('\\')) return false;
  return true;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  const storage = getAdminStorage();
  if (!storage) return res.status(500).json({ error: 'Storage not initialized' });
  const bucket = storage.bucket();

  const body = (req.body || {}) as FinalizeSnapshotRequest;
  const sessionId = normalizeSessionId(body.sessionId);
  const objectId = normalizeObjectId(body.objectId);
  if (!sessionId) return res.status(400).json({ error: 'Invalid sessionId' });
  if (!objectId) return res.status(400).json({ error: 'Invalid objectId' });

  const filePathRaw = typeof body.filePath === 'string' ? body.filePath.trim() : '';
  if (!filePathRaw || !isAllowedPath(filePathRaw, sessionId)) {
    return res.status(400).json({ error: 'Invalid filePath' });
  }

  const partnerId = normalizePartnerId(body.partnerId);
  const width = clampInt(body.width);
  const height = clampInt(body.height);
  const orientation =
    body.orientation === 'portrait' || body.orientation === 'landscape' ? body.orientation : undefined;

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
  const platform = inferPlatform(req.headers['user-agent']);

  const file = bucket.file(filePathRaw);

  try {
    await file.setMetadata({
      contentType: 'image/jpeg',
      contentDisposition: 'inline',
      cacheControl: 'private, max-age=31536000',
      metadata: {
        session_id: sessionId,
        object_id: objectId,
        ...(partnerId ? { partner_id: partnerId } : {}),
        device: platform,
        ...(orientation ? { orientation } : {}),
        ...(width ? { width: String(width) } : {}),
        ...(height ? { height: String(height) } : {}),
      },
    });

    const visitorRef = db.collection('visitors').doc(visitorId);
    const eventRef = db.collection('journeyEvents').doc();

    await db.runTransaction(async (t) => {
      const visitorSnap = await t.get(visitorRef);
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

      t.set(eventRef, {
        visitorId,
        type: 'AR_SNAPSHOT_CREATED',
        createdAt: FieldValue.serverTimestamp(),
        objectId,
        meta: {
          platform,
          arSessionId: sessionId,
          snapshot: {
            sessionId,
            storagePath: filePathRaw,
            ...(typeof width === 'number' ? { width } : {}),
            ...(typeof height === 'number' ? { height } : {}),
            ...(orientation ? { orientation } : {}),
            ...(partnerId ? { partnerId } : {}),
          },
        },
      });

      t.set(
        visitorRef,
        {
          lastEventType: 'AR_SNAPSHOT_CREATED',
          lastEventAt: FieldValue.serverTimestamp(),
          lastObjectId: objectId,
          lastSnapshotAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('[snapshots/finalize] error:', error);
    const message = error?.message ? String(error.message) : 'Failed to finalize snapshot';
    return res.status(500).json({ error: message });
  }
}

