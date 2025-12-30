
// pages/api/objects/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import type { ObjectAdmin } from '../../../types';
import { verifyIdToken, isAdmin } from '../../../lib/authMiddleware';
import { COLLECTIONS } from '../../../lib/db/collections';

const getUrlExtension = (url: unknown) => {
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

const validateModelUrls = (data: Partial<ObjectAdmin>) => {
  if (typeof data.modelGlbUrl === 'string') {
    const ext = getUrlExtension(data.modelGlbUrl);
    if (ext === 'usdz') {
      throw new Error('modelGlbUrl must point to a .glb file');
    }
  }

  if (typeof data.modelUsdzUrl === 'string') {
    const ext = getUrlExtension(data.modelUsdzUrl);
    if (ext === 'glb') {
      throw new Error('modelUsdzUrl must point to a .usdz file');
    }
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getAdminDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  // Authorization Check
  if (req.method !== 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = await verifyIdToken(token);
      if (!isAdmin(decodedToken)) {
          return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (req.method === 'POST') {
    try {
      const newObjectData: Omit<ObjectAdmin, 'id'> = req.body;
      validateModelUrls(newObjectData);
      // Basic validation
      if (!newObjectData.name) {
        return res.status(400).json({ error: 'Missing required object fields' });
      }
      const has3D = Boolean(newObjectData.modelGlbUrl || newObjectData.modelUsdzUrl);
      
      const docRef = await db.collection(COLLECTIONS.objects).add({
        ...newObjectData,
        has3D,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const newObject = { ...newObjectData, id: docRef.id };
      
      res.status(201).json(newObject);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      const status = errorMessage.startsWith('modelGlbUrl') || errorMessage.startsWith('modelUsdzUrl') ? 400 : 500;
      res.status(status).json({ error: `Failed to create object: ${errorMessage}` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
