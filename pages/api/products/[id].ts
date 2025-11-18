
// pages/api/products/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { Product } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const db = getAdminDb();

  if (!db) {
    return res.status(500).json({ error: 'Admin DB not initialized' });
  }

  if (req.method === 'PUT') {
    try {
      const updatedProduct: Product = req.body;
      await db.collection('products').doc(id as string).set(updatedProduct, { merge: true });
      res.status(200).json(updatedProduct);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await db.collection('products').doc(id as string).delete();
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
