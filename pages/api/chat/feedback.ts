import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { reason, messages, recommendedObjectIds } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const db = getAdminDb();
    if (db) {
      await db.collection('chat_feedback').add({
        reason,
        recommendedObjectIds: recommendedObjectIds || [],
        messages: messages || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      console.warn('Feedback received, but Firestore is not available', { reason, recommendedObjectIds });
    }

    res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Feedback API error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
