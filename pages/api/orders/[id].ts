
// pages/api/orders/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { verifyIdToken, isAdmin } from '../../../lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const db = getAdminDb();

  if (!db) {
    return res.status(500).json({ error: 'Admin DB not initialized' });
  }

  // Authorization Check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
      const decodedToken = await verifyIdToken(token);
      if (!isAdmin(decodedToken.email)) {
          return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'PUT') {
    try {
      const { status } = req.body;
      if (!['new', 'processing', 'completed', 'cancelled'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
      }

      await db.collection('orders').doc(id as string).update({ status });
      res.status(200).json({ message: 'Order status updated' });
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
