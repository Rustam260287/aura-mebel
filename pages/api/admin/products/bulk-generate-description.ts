import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { verifyIdToken, isAdmin } from '../../../../lib/authMiddleware';
import type { Product } from '../../../../types';
import { generateImprovedProductDescription } from '../../../../services/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set; cannot generate bulk descriptions');
    return res.status(500).json({ error: 'Description generation service is not configured (missing OPENAI_API_KEY)' });
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

  const { productIds } = req.body as { productIds?: string[] };
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'productIds must be a non-empty array' });
  }

  const db = getAdminDb();
  const limitedIds = productIds.slice(0, 30);

  const results: { id: string; status: 'ok' | 'skipped' | 'error'; message?: string }[] = [];

  for (const id of limitedIds) {
    try {
      const docRef = db.collection('products').doc(id);
      const snapshot = await docRef.get();
      if (!snapshot.exists) {
        results.push({ id, status: 'skipped', message: 'not found' });
        continue;
      }

      const data = snapshot.data() as Product;
      if (!data?.name) {
        results.push({ id, status: 'skipped', message: 'missing name' });
        continue;
      }

      const currentDescription = data.description || '';
      const length = currentDescription.replace(/\s+/g, ' ').trim().length;
      if (length >= 400 && !/уточните.+консультант/iu.test(currentDescription)) {
        results.push({ id, status: 'skipped', message: 'description already good' });
        continue;
      }

      const improved = await generateImprovedProductDescription({
        name: data.name,
        category: data.category || '',
        rawDescription: currentDescription,
      });

      await docRef.set(
        {
          description: improved,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      results.push({ id, status: 'ok' });
    } catch (error) {
      console.error(`Bulk description error for product ${id}:`, error);
      results.push({ id, status: 'error', message: 'generation failed' });
    }
  }

  const updatedCount = results.filter((r) => r.status === 'ok').length;
  res.status(200).json({ updatedCount, results });
}
