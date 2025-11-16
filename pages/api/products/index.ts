
// pages/api/products/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { Product } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getAdminDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  if (req.method === 'POST') {
    try {
      const newProductData: Omit<Product, 'id'> = req.body;
      // Basic validation
      if (!newProductData.name || !newProductData.price) {
        return res.status(400).json({ error: 'Missing required product fields' });
      }
      
      const docRef = await db.collection('products').add({
        ...newProductData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const newProduct = { id: docRef.id, ...newProductData };
      
      res.status(201).json(newProduct);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: `Failed to create product: ${errorMessage}` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
