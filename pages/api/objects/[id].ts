
// pages/api/objects/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
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

const DELETE_FIELD = admin.firestore.FieldValue.delete();

const normalizeModelUrlPatchValue = (value: unknown): string | admin.firestore.FieldValue | undefined => {
  if (value === null) return DELETE_FIELD;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : DELETE_FIELD;
};

const validateModelUrls = (dataToUpdate: Partial<ObjectAdmin>) => {
  if (Object.prototype.hasOwnProperty.call(dataToUpdate, 'modelGlbUrl')) {
    if (dataToUpdate.modelGlbUrl !== null && typeof dataToUpdate.modelGlbUrl !== 'string') {
      throw new Error('modelGlbUrl must be a string');
    }
    if (typeof dataToUpdate.modelGlbUrl === 'string') {
      const ext = getUrlExtension(dataToUpdate.modelGlbUrl);
      if (ext === 'usdz') {
        throw new Error('modelGlbUrl must point to a .glb file');
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(dataToUpdate, 'modelUsdzUrl')) {
    if (dataToUpdate.modelUsdzUrl !== null && typeof dataToUpdate.modelUsdzUrl !== 'string') {
      throw new Error('modelUsdzUrl must be a string');
    }
    if (typeof dataToUpdate.modelUsdzUrl === 'string') {
      const ext = getUrlExtension(dataToUpdate.modelUsdzUrl);
      if (ext === 'glb') {
        throw new Error('modelUsdzUrl must point to a .usdz file');
      }
    }
  }
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
        if (!isAdmin(decodedToken)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const updatedObject: ObjectAdmin = req.body;
      // Ensure ID consistency
      if (updatedObject.id && updatedObject.id !== id) {
          return res.status(400).json({ error: 'ID mismatch' });
      }
      
      const { id: _, ...dataToUpdate } = updatedObject; // Exclude ID from data being written
      validateModelUrls(dataToUpdate);

      const docRef = db.collection(COLLECTIONS.objects).doc(id as string);

      const hasModelGlbUrl = Object.prototype.hasOwnProperty.call(dataToUpdate, 'modelGlbUrl');
      const hasModelUsdzUrl = Object.prototype.hasOwnProperty.call(dataToUpdate, 'modelUsdzUrl');
      const { modelGlbUrl: _modelGlbUrl, modelUsdzUrl: _modelUsdzUrl, ...safeDataToUpdate } = dataToUpdate as any;

      const modelGlbUrlPatch = hasModelGlbUrl
        ? normalizeModelUrlPatchValue((dataToUpdate as any).modelGlbUrl)
        : undefined;
      const modelUsdzUrlPatch = hasModelUsdzUrl
        ? normalizeModelUrlPatchValue((dataToUpdate as any).modelUsdzUrl)
        : undefined;

      const existingSnap = await docRef.get();
      const existing = (existingSnap.data() || {}) as Partial<ObjectAdmin>;

      const resolvedGlb =
        typeof modelGlbUrlPatch === 'string'
          ? modelGlbUrlPatch
          : modelGlbUrlPatch === DELETE_FIELD
            ? undefined
            : existing.modelGlbUrl;
      const resolvedUsdz =
        typeof modelUsdzUrlPatch === 'string'
          ? modelUsdzUrlPatch
          : modelUsdzUrlPatch === DELETE_FIELD
            ? undefined
            : existing.modelUsdzUrl;

      const has3D = Boolean(resolvedGlb || resolvedUsdz);

      const patch: Record<string, unknown> = {
        ...safeDataToUpdate,
        has3D,
        updatedAt: new Date().toISOString(),
      };
      if (modelGlbUrlPatch !== undefined) patch.modelGlbUrl = modelGlbUrlPatch;
      if (modelUsdzUrlPatch !== undefined) patch.modelUsdzUrl = modelUsdzUrlPatch;

      await docRef.set({
          ...patch,
      }, { merge: true });

      const savedDoc = await docRef.get();
      const savedObject = {
        ...savedDoc.data(),
        id: savedDoc.id,
      } as ObjectAdmin;

      res.status(200).json(savedObject);
    } catch (error) {
      console.error("Update object error:", error);
      const message = error instanceof Error ? error.message : 'Failed to update object';
      const status = message.startsWith('modelGlbUrl') || message.startsWith('modelUsdzUrl') ? 400 : 500;
      res.status(status).json({ error: message });
    }
  } else if (req.method === 'DELETE') {
    try {
      await db.collection(COLLECTIONS.objects).doc(id as string).delete();
      res.status(204).end();
    } catch (error) {
      console.error("Delete object error:", error);
      res.status(500).json({ error: 'Failed to delete object' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
