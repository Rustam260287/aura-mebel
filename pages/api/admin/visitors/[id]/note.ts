import type { NextApiRequest, NextApiResponse } from 'next';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../../../lib/firebaseAdmin';
import { requireAdminSession } from '../../../../../lib/auth/admin-session';

type NoteRequest = {
  text?: string;
};

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 2000);
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

  const body = (req.body || {}) as NoteRequest;
  const text = normalizeText(body.text);
  if (!text) return res.status(400).json({ error: 'Empty note' });

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });

  try {
    const visitorRef = db.collection('visitors').doc(visitorId);
    const snap = await visitorRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Visitor not found' });

    const noteRef = visitorRef.collection('notes').doc();
    await noteRef.set({
      text,
      createdAt: FieldValue.serverTimestamp(),
      author: {
        uid: session.uid,
        ...(session.email ? { email: session.email } : {}),
      },
    });

    return res.status(200).json({ ok: true, id: noteRef.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save note';
    return res.status(500).json({ error: message });
  }
}

