
// pages/api/products/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { Product } from '../../../types';
import { verifyIdToken, isAdmin } from '../../../lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const db = getAdminDb();

  if (!db) {
    return res.status(500).json({ error: 'Admin DB not initialized' });
  }

  // Authorization Check for all modification methods
  if (req.method === 'PUT' || req.method === 'DELETE') {
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
  }

  if (req.method === 'PUT') {
    try {
      const updatedProduct: Product = req.body;
      // Ensure ID consistency
      if (updatedProduct.id && updatedProduct.id !== id) {
          return res.status(400).json({ error: 'ID mismatch' });
      }
      
      const { id: _, ...dataToUpdate } = updatedProduct; // Exclude ID from data being written

      const docRef = db.collection('products').doc(id as string);
      console.info(`[api/products/${id}] Updating product`, {
        model3dUrl: dataToUpdate.model3dUrl,
        model3dIosUrl: dataToUpdate.model3dIosUrl,
        has3D: dataToUpdate.has3D,
      });

      await docRef.set({
          ...dataToUpdate,
          updatedAt: new Date().toISOString()
      }, { merge: true });

      const savedDoc = await docRef.get();
      const savedProduct = {
        id: savedDoc.id,
        ...savedDoc.data(),
      } as Product;

      res.status(200).json(savedProduct);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await db.collection('products').doc(id as string).delete();
      res.status(204).end();
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
