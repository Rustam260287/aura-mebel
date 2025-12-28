
// pages/api/products/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
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

const normalizeModelUrls = (data: Partial<Product>) => {
  const model3dUrlExt = getModelUrlExtension(data.model3dUrl);
  const model3dIosUrlExt = getModelUrlExtension(data.model3dIosUrl);

  const normalized: Partial<Product> = { ...data };

  if (model3dUrlExt === 'usdz' && typeof normalized.model3dUrl === 'string') {
    if (!normalized.model3dIosUrl || model3dIosUrlExt !== 'usdz') {
      normalized.model3dIosUrl = normalized.model3dUrl;
    }
    delete (normalized as any).model3dUrl;
  }

  if (model3dIosUrlExt === 'glb' && typeof normalized.model3dIosUrl === 'string') {
    if (!normalized.model3dUrl || model3dUrlExt !== 'glb') {
      normalized.model3dUrl = normalized.model3dIosUrl;
    }
    delete (normalized as any).model3dIosUrl;
  }

  normalized.has3D = Boolean(normalized.model3dUrl || normalized.model3dIosUrl);
  return normalized;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getAdminDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  // Authorization Check
  if (req.method !== 'GET') { // GET requests might be public? Or typically product listing is public via other means. This endpoint seems to be for creation (POST).
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

  if (req.method === 'POST') {
    try {
      const newProductData: Omit<Product, 'id'> = normalizeModelUrls(req.body);
      // Basic validation
      if (!newProductData.name) {
        return res.status(400).json({ error: 'Missing required product fields' });
      }
      
      const docRef = await db.collection('products').add({
        ...newProductData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const newProduct = { ...newProductData, id: docRef.id };
      
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
