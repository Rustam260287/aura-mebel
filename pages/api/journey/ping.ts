import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { inferCountry, inferDevice, inferOs } from '../../../lib/journey/userAgent';
import { parseCookies, serializeCookie } from '../../../lib/journey/cookies';
import { FieldValue } from 'firebase-admin/firestore';

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

import { setCorsHeaders } from '../../../lib/api/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

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

  const ref = db.collection('visitors').doc(visitorId);

  try {
    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists) {
        t.set(ref, {
          firstSeenAt: FieldValue.serverTimestamp(),
          lastSeenAt: FieldValue.serverTimestamp(),
          device,
          os,
          ...(country ? { country } : {}),
        });
        return;
      }

      const data = snap.data() || {};
      const patch: Record<string, unknown> = {
        lastSeenAt: FieldValue.serverTimestamp(),
      };
      if (!data.device) patch.device = device;
      if (!data.os) patch.os = os;
      if (!data.country && country) patch.country = country;
      t.set(ref, patch, { merge: true });
    });

    return res.status(200).json({ visitorId });
  } catch (error) {
    console.error('journey ping error:', error);
    const message = error instanceof Error ? error.message : 'Failed to ping visitor';
    return res.status(500).json({ error: message });
  }
}

