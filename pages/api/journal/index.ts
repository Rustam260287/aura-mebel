
// pages/api/journal/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import type { JournalEntry } from '../../../types';
import { verifyIdToken, isAdmin } from '../../../lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getAdminDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  // Authorization Check
  if (req.method === 'POST') {
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

    try {
      const newPostData: Omit<JournalEntry, 'id'> = req.body;
       if (!newPostData.title || !newPostData.content) {
        return res.status(400).json({ error: 'Missing required journal entry fields' });
      }

      const docRef = await db.collection('blog').add({
        ...newPostData,
        date: new Date().toISOString(),
      });
      
      const newPost = { id: docRef.id, ...newPostData };

      res.status(201).json(newPost);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: `Failed to create journal entry: ${errorMessage}` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
