import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import type { ObjectPublic } from '../../../types';
import { toPublicObject } from '../../../lib/publicObject';
import { COLLECTIONS } from '../../../lib/db/collections';

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
    return res.status(200).json({ objects: [] });
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

    const results: ObjectPublic[] = [];
    for (const chunk of chunks) {
      const snap = await db.collection(COLLECTIONS.objects).where('__name__', 'in', chunk).get();
      snap.forEach(doc => {
        results.push(toPublicObject(doc.data(), doc.id));
      });
    }

    res.setHeader('Cache-Control', 'public, max-age=30');
    return res.status(200).json({ objects: results });
  } catch (error) {
    console.error('Saved objects fetch error:', error);
    return res.status(500).json({ error: 'Failed to load saved objects' });
  }
}
