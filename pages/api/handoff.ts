import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../lib/firebaseAdmin';

interface HandoffSettingsPublic {
  managerName?: string;
  managerRole?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  messageAfterAr?: string;
  updatedAt?: string;
}

const parseList = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

const pickFirstEmail = (...lists: Array<string[] | undefined>): string => {
  for (const list of lists) {
    for (const entry of list || []) {
      const e = String(entry || '').trim();
      if (e && e.includes('@')) return e;
    }
  }
  return '';
};

const DEFAULT_PUBLIC: HandoffSettingsPublic = {
  managerName: '',
  managerRole: 'куратор',
  email: '',
  phone: '',
  whatsapp: '',
  telegram: '',
  messageAfterAr: 'Если хотите — обсудим решение. Напишите, когда будет удобно.',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  try {
    const snap = await db.collection('settings').doc('handoff').get();
    const data = snap.exists ? (snap.data() as HandoffSettingsPublic) : {};

    const envEmail =
      (process.env.HANDOFF_EMAIL || '').trim() ||
      pickFirstEmail(
        parseList(process.env.MANAGER_EMAILS),
        parseList(process.env.ADMIN_EMAILS),
        parseList(process.env.OWNER_EMAILS),
      );

    const merged: HandoffSettingsPublic = { ...DEFAULT_PUBLIC, ...data };
    if (!String(merged.email || '').trim() && envEmail) {
      merged.email = envEmail;
    }

    const envPhone = (process.env.HANDOFF_PHONE || '').trim();
    if (!String(merged.phone || '').trim() && envPhone) {
      merged.phone = envPhone;
    }

    const rawPhone = String(merged.phone || '').trim();
    const digits = rawPhone.replace(/[^\d+]/g, '');
    const hasDigits = digits.replace(/\D/g, '').length >= 10;

    if (!String(merged.whatsapp || '').trim() && hasDigits) {
      const waDigits = digits.replace(/\D/g, '');
      merged.whatsapp = `https://wa.me/${waDigits}`;
    }
    if (!String(merged.telegram || '').trim() && hasDigits) {
      merged.telegram = `https://t.me/+${digits.replace(/\D/g, '')}`;
    }

    return res.status(200).json(merged);
  } catch (error) {
    console.error('handoff public error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load settings';
    return res.status(500).json({ error: message });
  }
}
