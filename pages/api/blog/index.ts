
// pages/api/blog/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { BlogPost } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getAdminDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  if (req.method === 'POST') {
    try {
      const newPostData: Omit<BlogPost, 'id'> = req.body;
       if (!newPostData.title || !newPostData.content) {
        return res.status(400).json({ error: 'Missing required blog post fields' });
      }

      const docRef = await db.collection('blog').add({
        ...newPostData,
        date: new Date().toISOString(),
      });
      
      const newPost = { id: docRef.id, ...newPostData };

      res.status(201).json(newPost);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: `Failed to create blog post: ${errorMessage}` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
