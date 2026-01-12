import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { verifyAdmin } from '../../../lib/auth/admin-check';

interface HandoffSettings {
  managerName?: string;
  managerRole?: string;
  avatarUrl?: string; // New
  workingHours?: string; // New
  availabilityStatus?: 'online' | 'offline' | 'schedule'; // New
  email?: string;
  phone?: string;
  whatsapp?: string; // Legacy DB key, we will map whatsappNumber to this or use new key
  whatsappNumber?: string; // New preferred
  telegram?: string;
  telegramUsername?: string; // New preferred
  messageAfterAr?: string;
  updatedAt?: string;
}

const DEFAULT_SETTINGS: HandoffSettings = {
  managerName: '',
  managerRole: 'куратор',
  email: '',
  phone: '',
  whatsapp: '',
  whatsappNumber: '',
  telegram: '',
  telegramUsername: '',
  messageAfterAr: 'Если хотите — обсудим решение. Напишите, когда будет удобно.',
  updatedAt: new Date().toISOString(),
};

const normalizeString = (val: unknown): string | undefined => {
  if (typeof val !== 'string') return undefined;
  return val.trim() || undefined;
};

const normalizePhone = (val: unknown): string | undefined => {
  if (typeof val !== 'string') return undefined;
  const num = val.replace(/[^0-9+]/g, '');
  return num || undefined;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isAdmin = await verifyAdmin(req, res);
  if (!isAdmin) return;

  const db = getAdminDb();
  // Fixed ID for the global handoff settings
  const docRef = db.collection('config').doc('handoff');

  if (req.method === 'GET') {
    try {
      const snap = await docRef.get();
      if (!snap.exists) {
        return res.status(200).json(DEFAULT_SETTINGS);
      }
      return res.status(200).json({ ...DEFAULT_SETTINGS, ...snap.data() });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  if (req.method === 'PUT') {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const patch: HandoffSettings = {
        managerName: normalizeString(body.managerName),
        managerRole: normalizeString(body.managerRole),
        avatarUrl: normalizeString(body.avatarUrl),
        workingHours: normalizeString(body.workingHours),
        availabilityStatus: (body.availabilityStatus as any) || 'online',

        // Map new keys to DB keys if we want, or keep both.
        // Let's settle on using the specific ones for clarity? 
        // Existing DB uses 'whatsapp'. Let's support both for read, but write specific.
        whatsapp: normalizePhone(body.whatsapp) || normalizePhone(body.whatsappNumber),
        whatsappNumber: normalizePhone(body.whatsappNumber),

        telegram: normalizeString(body.telegram) || normalizeString(body.telegramUsername),
        telegramUsername: normalizeString(body.telegramUsername),

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

