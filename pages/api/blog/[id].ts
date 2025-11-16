
// pages/api/blog/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { BlogPost } from '../../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  const db = getAdminDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }
  const postRef = db.collection('blog').doc(id);

  if (req.method === 'PUT') {
    try {
      const updatedPostData: Partial<BlogPost> = req.body;
      delete updatedPostData.id;

      await postRef.update({
        ...updatedPostData,
        date: new Date().toISOString(), // Consider if date should be updated
      });

      const updatedDoc = await postRef.get();
      const updatedPost = { id: updatedDoc.id, ...updatedDoc.data() };
      
      res.status(200).json(updatedPost);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: `Failed to update blog post: ${errorMessage}` });
    }
  } else if (req.method === 'DELETE') {
    try {
        const doc = await postRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        await postRef.delete();
        res.status(204).end();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        res.status(500).json({ error: `Failed to delete blog post: ${errorMessage}` });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
