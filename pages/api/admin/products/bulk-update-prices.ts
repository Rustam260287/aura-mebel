import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { verifyIdToken, isAdmin } from '../../../../lib/authMiddleware';
import type { Product } from '../../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = await verifyIdToken(token);
    if (!isAdmin(decoded.email)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { productIds, percent } = req.body as { productIds?: string[]; percent?: number };

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'productIds must be a non-empty array' });
  }

  if (typeof percent !== 'number' || !Number.isFinite(percent) || percent === 0) {
    return res.status(400).json({ error: 'percent must be a non-zero number' });
  }

  if (percent < -90 || percent > 500) {
    return res.status(400).json({ error: 'percent is out of allowed range (-90 .. 500)' });
  }

  const db = getAdminDb();
  const limitedIds = productIds.slice(0, 100);

  const batch = db.batch();
  const results: { id: string; status: 'ok' | 'skipped'; message?: string }[] = [];

  for (const id of limitedIds) {
    const docRef = db.collection('products').doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      results.push({ id, status: 'skipped', message: 'not found' });
      continue;
    }
    const data = snapshot.data() as Product;
    const currentPrice = data?.price;
    if (typeof currentPrice !== 'number' || !Number.isFinite(currentPrice) || currentPrice <= 0) {
      results.push({ id, status: 'skipped', message: 'invalid price' });
      continue;
    }

    const newPrice = Math.round(currentPrice * (1 + percent / 100));
    batch.set(
      docRef,
      {
        price: newPrice,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    results.push({ id, status: 'ok' });
  }

  await batch.commit();
  const updatedCount = results.filter((r) => r.status === 'ok').length;
  res.status(200).json({ updatedCount, results });
}

