import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { verifyIdToken, isAdmin } from '../../../../lib/authMiddleware';
import type { Product } from '../../../../types';

async function generateProductDescription(name: string, category: string, rawDescription: string) {
  const API_URL = `${process.env.ARTEMOX_BASE_URL}/models/gemini-1.5-flash:generateContent`;
  const apiKey = process.env.ARTEMOX_API_KEY;

  if (!API_URL || !apiKey) {
    throw new Error('Description generation service is not configured');
  }

  const prompt = `Ты — опытный копирайтер для премиального мебельного магазина.

Тебе нужно переписать описание товара так, чтобы оно:
- было на русском;
- звучало живо и продающе;
- содержало 2–4 абзаца;
- обязательно упоминало ключевые характеристики (размеры, материалы, стиль), если они видны из текста;
- в конце дало краткий блок "Техническая информация:" с перечислением основных параметров в виде списка.

Название: "${name}"
Категория: "${category}"
Сырое описание: "${rawDescription || ''}"

Верни только готовый текст без пояснений и без разметки Markdown.`;

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
    console.error('Gemini API Error (bulk description):', errorText);
    throw new Error('Failed to generate description');
  }

  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!generatedText) {
    throw new Error('No description generated');
  }

  return generatedText.trim();
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

      const improved = await generateProductDescription(
        data.name,
        data.category || '',
        currentDescription,
      );

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

