import type { NextApiRequest, NextApiResponse } from 'next';
import { checkIsAdmin } from '../../../../lib/auth/admin-check';
import { getAdminStorage } from '../../../../lib/firebaseAdmin';

type UploadUrlRequest = {
  objectId?: string;
  size?: number;
  contentType?: string;
};

type UploadUrlResponse = {
  uploadUrl: string;
  filePath: string;
  contentType: string;
  maxSizeBytes: number;
};

const MAX_MODEL_SIZE = 120 * 1024 * 1024; // 120MB (input can be large before optimization)

const normalizeObjectId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[a-zA-Z0-9_-]{4,160}$/.test(trimmed)) return null;
  return trimmed;
};

let corsEnsured = false;
async function ensureBucketCors(bucket: any) {
  if (corsEnsured) return;
  corsEnsured = true;
  try {
    await bucket.setCorsConfiguration([
      {
        origin: ['*'],
        method: ['GET', 'HEAD', 'PUT', 'POST', 'OPTIONS'],
        responseHeader: ['Content-Type', 'Content-Length', 'ETag'],
        maxAgeSeconds: 3600,
      },
    ]);
  } catch (error) {
    corsEnsured = false;
    console.warn('[models/upload-url] Failed to ensure bucket CORS:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const isAdmin = await checkIsAdmin(req);
  if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

  const body = (req.body || {}) as UploadUrlRequest;
  const objectId = normalizeObjectId(body.objectId);
  if (!objectId) return res.status(400).json({ error: 'Invalid objectId' });

  const size = typeof body.size === 'number' && Number.isFinite(body.size) ? body.size : undefined;
  if (typeof size === 'number' && size > MAX_MODEL_SIZE) {
    return res.status(413).json({ error: 'File too large' });
  }

  const ct = typeof body.contentType === 'string' ? body.contentType.toLowerCase().split(';')[0].trim() : '';
  if (ct && ct !== 'model/gltf-binary') {
    return res.status(415).json({ error: 'Only .glb is accepted as master format' });
  }

  const storage = getAdminStorage();
  if (!storage) return res.status(500).json({ error: 'Storage not initialized' });
  const bucket = storage.bucket();

  await ensureBucketCors(bucket);

  const contentType = 'model/gltf-binary';
  const filePath = `models/${objectId}/original.glb`;
  const file = bucket.file(filePath);

  try {
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    const payload: UploadUrlResponse = {
      uploadUrl,
      filePath,
      contentType,
      maxSizeBytes: MAX_MODEL_SIZE,
    };
    return res.status(200).json(payload);
  } catch (error: any) {
    console.error('[models/upload-url] signed url error:', error);
    return res.status(500).json({ error: error?.message ? String(error.message) : 'Internal Server Error' });
  }
}

