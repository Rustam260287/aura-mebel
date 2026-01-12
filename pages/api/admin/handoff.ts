import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
// import { verifyAdmin } from '../../../lib/auth/admin-check'; // Deprecated for this endpoint
import { verifyRole } from '../../../lib/auth/rbac';

interface HandoffSettings {
  managerName?: string | null;
  managerRole?: string | null;
  avatarUrl?: string | null;
  workingHours?: string | null;
  availabilityStatus?: 'online' | 'offline' | 'schedule';
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  whatsappNumber?: string | null;
  telegram?: string | null;
  telegramUsername?: string | null;
  messageAfterAr?: string | null;
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

const normalizeString = (val: unknown): string | null => {
  if (typeof val !== 'string') return null;
  return val.trim() || null;
};

const normalizePhone = (val: unknown): string | null => {
  if (typeof val !== 'string') return null;
  const num = val.replace(/[^0-9+]/g, '');
  return num || null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getAdminDb();
  const docRef = db.collection('config').doc('handoff');

  if (req.method === 'GET') {
    // READ: Allow Owner, Admin, Editor
    const hasAccess = await verifyRole(req, res, ['owner', 'admin', 'editor']);
    if (!hasAccess) return;

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
    // WRITE: Allow only Owner, Admin (Global Config protect)
    const hasAccess = await verifyRole(req, res, ['owner', 'admin']);
    if (!hasAccess) return;

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

