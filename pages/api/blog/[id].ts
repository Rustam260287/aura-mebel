
// pages/api/blog/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { BlogPost } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const db = getAdminDb();

  if (!db) {
    return res.status(500).json({ error: 'Admin DB not initialized' });
  }

  if (req.method === 'PUT') {
    try {
      const updatedPost: BlogPost = req.body;
      await db.collection('blog').doc(id as string).set(updatedPost, { merge: true });
      res.status(200).json(updatedPost);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update blog post' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await db.collection('blog').doc(id as string).delete();
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete blog post' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
