import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { Product } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const idsParam = req.query.ids;
  const ids = Array.isArray(idsParam)
    ? idsParam.flatMap(v => v.split(','))
    : typeof idsParam === 'string'
      ? idsParam.split(',')
      : [];

  const normalizedIds = ids.map(id => id.trim()).filter(Boolean);

  if (normalizedIds.length === 0) {
    return res.status(200).json({ products: [] });
  }

  const db = getAdminDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  try {
    const chunks: string[][] = [];
    const chunkSize = 10; // Firestore IN max 10
    for (let i = 0; i < normalizedIds.length; i += chunkSize) {
      chunks.push(normalizedIds.slice(i, i + chunkSize));
    }

    const results: Product[] = [];
    for (const chunk of chunks) {
      const snap = await db.collection('products').where('__name__', 'in', chunk).get();
      snap.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() } as Product);
      });
    }

    res.setHeader('Cache-Control', 'public, max-age=30');
    return res.status(200).json({ products: results });
  } catch (error) {
    console.error('Wishlist fetch error:', error);
    return res.status(500).json({ error: 'Failed to load wishlist products' });
  }
}
