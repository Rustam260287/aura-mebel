
// pages/api/products/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { Product } from '../../../types';
import { verifyIdToken, isAdmin } from '../../../lib/authMiddleware';

const getModelUrlExtension = (url: unknown) => {
  if (typeof url !== 'string') return undefined;

  const cleaned = url.split('#')[0];

  try {
    const parsed = new URL(cleaned);
    const lastSegment = parsed.pathname.split('/').pop() || '';
    const decoded = decodeURIComponent(lastSegment);
    return decoded.split('.').pop()?.toLowerCase();
  } catch {
    const withoutQuery = cleaned.split('?')[0];
    const lastSegment = withoutQuery.split('/').pop() || '';
    try {
      const decoded = decodeURIComponent(lastSegment);
      return decoded.split('.').pop()?.toLowerCase();
    } catch {
      return lastSegment.split('.').pop()?.toLowerCase();
    }
  }
};

const normalizeModelUrls = (dataToUpdate: Partial<Product>) => {
  const model3dUrlExt = getModelUrlExtension(dataToUpdate.model3dUrl);
  const model3dIosUrlExt = getModelUrlExtension(dataToUpdate.model3dIosUrl);

  const patch: Partial<Product> & {
    model3dUrl?: string | admin.firestore.FieldValue;
    model3dIosUrl?: string | admin.firestore.FieldValue;
    has3D?: boolean;
  } = { ...dataToUpdate };

  if (model3dUrlExt === 'usdz' && typeof dataToUpdate.model3dUrl === 'string') {
    if (!patch.model3dIosUrl || model3dIosUrlExt !== 'usdz') {
      patch.model3dIosUrl = dataToUpdate.model3dUrl;
    }
    patch.model3dUrl = admin.firestore.FieldValue.delete();
  } else if (model3dUrlExt === 'glb' && typeof dataToUpdate.model3dUrl === 'string') {
    // ok
  }

  if (model3dIosUrlExt === 'glb' && typeof dataToUpdate.model3dIosUrl === 'string') {
    if (!patch.model3dUrl || model3dUrlExt !== 'glb') {
      patch.model3dUrl = dataToUpdate.model3dIosUrl;
    }
    patch.model3dIosUrl = admin.firestore.FieldValue.delete();
  } else if (model3dIosUrlExt === 'usdz' && typeof dataToUpdate.model3dIosUrl === 'string') {
    // ok
  }

  const normalizedGlb = typeof patch.model3dUrl === 'string' ? patch.model3dUrl : undefined;
  const normalizedUsdz = typeof patch.model3dIosUrl === 'string' ? patch.model3dIosUrl : undefined;
  patch.has3D = Boolean(normalizedGlb || normalizedUsdz);

  return patch;
};

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
      const normalizedUpdate = normalizeModelUrls(dataToUpdate);

      const docRef = db.collection('products').doc(id as string);
      console.info(`[api/products/${id}] Updating product`, {
        model3dUrl: normalizedUpdate.model3dUrl,
        model3dIosUrl: normalizedUpdate.model3dIosUrl,
        has3D: normalizedUpdate.has3D,
      });

      await docRef.set({
          ...normalizedUpdate,
          updatedAt: new Date().toISOString()
      }, { merge: true });

      const savedDoc = await docRef.get();
      const savedProduct = {
        ...savedDoc.data(),
        id: savedDoc.id,
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
