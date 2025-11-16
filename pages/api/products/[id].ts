
// pages/api/products/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { Product } from '../../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const db = getAdminDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }
  const productRef = db.collection('products').doc(id);

  if (req.method === 'PUT') {
    try {
      const updatedProductData: Partial<Product> = req.body;
      delete updatedProductData.id; // Ensure ID is not overwritten

      await productRef.update({
        ...updatedProductData,
        updatedAt: new Date().toISOString(),
      });
      
      const updatedDoc = await productRef.get();
      const updatedProduct = { id: updatedDoc.id, ...updatedDoc.data() };
      
      res.status(200).json(updatedProduct);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: `Failed to update product: ${errorMessage}` });
    }
  } else if (req.method === 'DELETE') {
    try {
      const doc = await productRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Product not found' });
      }
      await productRef.delete();
      res.status(204).end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: `Failed to delete product: ${errorMessage}` });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
