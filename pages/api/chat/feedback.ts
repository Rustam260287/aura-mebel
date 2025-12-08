import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { reason, messages, recommendedProductIds } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const db = getAdminDb();
    if (db) {
      await db.collection('chat_feedback').add({
        reason,
        recommendedProductIds: recommendedProductIds || [],
        messages: messages || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      console.warn('Feedback received, but Firestore is not available', { reason, recommendedProductIds });
    }

    res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Feedback API error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
