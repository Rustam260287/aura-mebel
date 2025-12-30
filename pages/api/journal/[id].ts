
// pages/api/journal/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import type { JournalEntry } from '../../../types';
import { verifyIdToken, isAdmin } from '../../../lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const db = getAdminDb();

  if (!db) {
    return res.status(500).json({ error: 'Admin DB not initialized' });
  }

  // Authorization Check
  if (req.method === 'PUT' || req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await verifyIdToken(token);
        if (!isAdmin(decodedToken)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const updatedPost: JournalEntry = req.body;
      // Ensure ID consistency
      if (updatedPost.id && updatedPost.id !== id) {
          return res.status(400).json({ error: 'ID mismatch' });
      }

      const { id: _, ...dataToUpdate } = updatedPost;

      await db.collection('blog').doc(id as string).set(dataToUpdate, { merge: true });
      res.status(200).json(updatedPost);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update journal entry' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await db.collection('blog').doc(id as string).delete();
      res.status(200).json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete journal entry' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
