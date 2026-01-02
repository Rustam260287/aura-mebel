import type { NextApiRequest, NextApiResponse } from 'next';
import { checkIsAdmin } from '../../../../lib/auth/admin-check';
import { getAdminDb, getAdminStorage } from '../../../../lib/firebaseAdmin';
import { COLLECTIONS } from '../../../../lib/db/collections';
import { runModelProcessingPipeline } from '../../../../lib/3d/model-pipeline';
import { toAdminObject } from '../../../../lib/adminObject';

type FinalizeRequest = {
  objectId?: string;
};

const normalizeObjectId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[a-zA-Z0-9_-]{4,160}$/.test(trimmed)) return null;
  return trimmed;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const isAdmin = await checkIsAdmin(req);
  if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

  const body = (req.body || {}) as FinalizeRequest;
  const objectId = normalizeObjectId(body.objectId);
  if (!objectId) return res.status(400).json({ error: 'Invalid objectId' });

  const db = getAdminDb();
  const storage = getAdminStorage();
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  if (!storage) return res.status(500).json({ error: 'Storage not initialized' });

  const docRef = db.collection(COLLECTIONS.objects).doc(objectId);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Object not found' });

  const bucket = storage.bucket();
  const originalPath = `models/${objectId}/original.glb`;
  const file = bucket.file(originalPath);

  try {
    await file.setMetadata({
      contentType: 'model/gltf-binary',
      contentDisposition: 'inline',
      cacheControl: 'private, max-age=31536000',
    });
  } catch (error: any) {
    console.warn('[models/finalize] metadata set failed:', error);
  }

  try {
    await docRef.set(
      {
        modelProcessing: {
          status: 'UPLOADED',
          original: { storagePath: originalPath },
          updatedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (error: any) {
    console.error('[models/finalize] failed to update object:', error);
    return res.status(500).json({ error: 'Failed to update object' });
  }

  try {
    await runModelProcessingPipeline(objectId);
    const updated = await docRef.get();
    const normalized = toAdminObject(updated.data(), updated.id);
    return res.status(200).json(normalized);
  } catch (error: any) {
    console.error('[models/finalize] pipeline failed:', error);
    return res.status(500).json({ error: error?.message ? String(error.message) : 'Pipeline failed' });
  }
}

