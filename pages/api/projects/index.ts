
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { getUserId } from '../../../lib/auth/user-check';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not available' });

  // GET: Fetch user's projects
  if (req.method === 'GET') {
    try {
      const snapshot = await db.collection('projects').where('userId', '==', userId).orderBy('updatedAt', 'desc').get();
      const projects = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      res.status(200).json(projects);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  // POST: Create a new project
  if (req.method === 'POST') {
    try {
      const { name } = req.body;
      const newProject = {
        userId,
        name: name || `Новый проект от ${new Date().toLocaleDateString('ru-RU')}`,
        role: 'client', // Default role
        items: [],
        chatHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const docRef = await db.collection('projects').add(newProject);
      res.status(201).json({ id: docRef.id, ...newProject });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
