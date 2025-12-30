import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { verifyAdmin } from '../../../lib/auth/admin-check';

interface HandoffSettings {
  managerName?: string;
  managerRole?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  messageAfterAr?: string;
  updatedAt?: string;
}

const DEFAULT_SETTINGS: HandoffSettings = {
  managerName: '',
  managerRole: 'куратор',
  email: '',
  phone: '',
  whatsapp: '',
  telegram: '',
  messageAfterAr: 'Если хотите — обсудим решение. Напишите, когда будет удобно.',
  updatedAt: new Date().toISOString(),
};

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : '';
};

const normalizePhone = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  return value.replace(/[^\d+]/g, '').trim();
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isAdmin = await verifyAdmin(req, res);
  if (!isAdmin) return;

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  const docRef = db.collection('settings').doc('handoff');

  if (req.method === 'GET') {
    try {
      const snap = await docRef.get();
      const data = snap.exists ? (snap.data() as HandoffSettings) : DEFAULT_SETTINGS;
      return res.status(200).json({ ...DEFAULT_SETTINGS, ...data });
    } catch (error) {
      console.error('handoff GET error:', error);
      const message = error instanceof Error ? error.message : 'Failed to load settings';
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const patch: HandoffSettings = {
        managerName: normalizeString(body.managerName),
        managerRole: normalizeString(body.managerRole),
        email: normalizeString(body.email),
        phone: normalizePhone(body.phone),
        whatsapp: normalizeString(body.whatsapp),
        telegram: normalizeString(body.telegram),
        messageAfterAr: normalizeString(body.messageAfterAr),
        updatedAt: new Date().toISOString(),
      };

      await docRef.set(patch, { merge: true });
      const saved = (await docRef.get()).data() as HandoffSettings | undefined;
      return res.status(200).json({ ...DEFAULT_SETTINGS, ...saved });
    } catch (error) {
      console.error('handoff PUT error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save settings';
      return res.status(500).json({ error: message });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ error: 'Method not allowed' });
}

