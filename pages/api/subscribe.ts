
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Пожалуйста, введите корректный email.' });
  }

  try {
    const db = getAdminDb();
    if (!db) {
        return res.status(500).json({ message: 'Database connection failed' });
    }

    // Проверяем, есть ли уже такой подписчик
    const subscriberRef = db.collection('subscribers').doc(email);
    const doc = await subscriberRef.get();

    if (doc.exists) {
        return res.status(200).json({ message: 'Вы уже подписаны!' });
    }

    await subscriberRef.set({
      email,
      subscribedAt: new Date().toISOString(),
    });

    res.status(200).json({ message: 'Спасибо за подписку!' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Произошла ошибка при подписке.' });
  }
}
