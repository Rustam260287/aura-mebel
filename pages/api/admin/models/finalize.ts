import type { NextApiRequest, NextApiResponse } from 'next';
import { checkIsAdmin } from '../../../../lib/auth/admin-check';
import { getAdminDb, getAdminStorage } from '../../../../lib/firebaseAdmin';
import { COLLECTIONS } from '../../../../lib/db/collections';
import { runGlbPipeline, runUsdzPipeline } from '../../../../lib/3d/model-pipeline';
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
  const originalGlb = bucket.file(`models/${objectId}/original.glb`);
  const originalUsdz = bucket.file(`models/${objectId}/ios.usdz`);

  try {
    const [glbExists] = await originalGlb.exists();
    const [usdzExists] = await originalUsdz.exists();

    if (glbExists) {
      await originalGlb.setMetadata({
        contentType: 'model/gltf-binary',
        cacheControl: 'private, max-age=31536000',
      });
      await runGlbPipeline(objectId);
    }

    if (usdzExists) {
      await originalUsdz.setMetadata({
        contentType: 'model/vnd.usdz+zip',
        cacheControl: 'private, max-age=31536000',
      });
      await runUsdzPipeline(objectId);
    }

  } catch (error: any) {
    console.warn('[models/finalize] metadata/pipeline failed:', error);
  }

  try {
    const updated = await docRef.get();
    const normalized = toAdminObject(updated.data(), updated.id);
    return res.status(200).json(normalized);
  } catch (error: any) {
    console.error('[models/finalize] failed to fetch updated object:', error);
    return res.status(500).json({ error: 'Failed to update object' });
  }
}
