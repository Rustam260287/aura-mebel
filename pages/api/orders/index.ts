
// pages/api/orders/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const db = getAdminDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  try {
    const { customer, items, total } = req.body;

    if (!customer || !items || !items.length) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    const orderData = {
      customer,
      items,
      total,
      status: 'new', // new, processing, completed, cancelled
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('orders').add(orderData);
    
    res.status(201).json({ id: docRef.id, message: 'Order placed successfully' });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}
