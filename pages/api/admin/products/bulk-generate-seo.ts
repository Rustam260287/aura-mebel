import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { verifyIdToken, isAdmin } from '../../../../lib/authMiddleware';
import type { Product } from '../../../../types';

async function generateSeoDescription(name: string, category: string, description: string) {
  const API_URL = `${process.env.ARTEMOX_BASE_URL}/models/gemini-1.5-flash:generateContent`;
  const apiKey = process.env.ARTEMOX_API_KEY;

  if (!API_URL || !apiKey) {
    throw new Error('SEO generation service is not configured');
  }

  const prompt = `Напиши привлекательное и оптимизированное для поисковых систем (SEO) описание (meta description) для товара. 
Название: "${name}". 
Категория: "${category}". 
Описание: "${description || ''}".

Сделай описание длиной от 140 до 160 символов. Используй ключевые слова, призывай к действию, но звучи естественно. Описание должно быть на русском языке.`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API Error (bulk SEO):', errorText);
    throw new Error('Failed to generate SEO description');
  }

  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!generatedText) {
    throw new Error('No SEO text generated');
  }

  return generatedText.trim().replace(/^["']|["']$/g, '');
}

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

  const { productIds } = req.body as { productIds?: string[] };
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'productIds must be a non-empty array' });
  }

  const db = getAdminDb();
  const limitedIds = productIds.slice(0, 50);

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

      const seo = await generateSeoDescription(data.name, data.category || '', data.description || '');
      await docRef.set(
        {
          seoDescription: seo,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      results.push({ id, status: 'ok' });
    } catch (error) {
      console.error(`Bulk SEO error for product ${id}:`, error);
      results.push({ id, status: 'error', message: 'generation failed' });
    }
  }

  const updatedCount = results.filter((r) => r.status === 'ok').length;
  res.status(200).json({ updatedCount, results });
}

