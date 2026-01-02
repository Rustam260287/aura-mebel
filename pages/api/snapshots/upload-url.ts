import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminStorage } from '../../../lib/firebaseAdmin';

type UploadSnapshotUrlRequest = {
  sessionId?: string;
  size?: number;
  contentType?: string;
};

type UploadSnapshotUrlResponse = {
  uploadUrl: string;
  filePath: string;
  contentType: string;
  maxSizeBytes: number;
};

const MAX_SNAPSHOT_SIZE = 12 * 1024 * 1024; // 12MB

const normalizeSessionId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[a-zA-Z0-9_-]{8,160}$/.test(trimmed)) return null;
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
    console.warn('[snapshots/upload-url] Failed to ensure bucket CORS:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  const body = (req.body || {}) as UploadSnapshotUrlRequest;
  const sessionId = normalizeSessionId(body.sessionId);
  if (!sessionId) return res.status(400).json({ error: 'Invalid sessionId' });

  const size = typeof body.size === 'number' && Number.isFinite(body.size) ? body.size : undefined;
  if (typeof size === 'number' && size > MAX_SNAPSHOT_SIZE) {
    return res.status(413).json({ error: 'File too large' });
  }

  const contentTypeRaw = typeof body.contentType === 'string' ? body.contentType.toLowerCase().split(';')[0].trim() : '';
  if (contentTypeRaw && contentTypeRaw !== 'image/jpeg' && contentTypeRaw !== 'image/jpg') {
    return res.status(415).json({ error: 'Unsupported content type' });
  }

  const storage = getAdminStorage();
  if (!storage) return res.status(500).json({ error: 'Storage not initialized' });
  const bucket = storage.bucket();

  await ensureBucketCors(bucket);

  const contentType = 'image/jpeg';
  const timestamp = Date.now();
  const filePath = `snapshots/session_${sessionId}/snapshot_${timestamp}.jpg`;
  const file = bucket.file(filePath);

  try {
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 10 * 60 * 1000,
      contentType,
    });

    const payload: UploadSnapshotUrlResponse = {
      uploadUrl,
      filePath,
      contentType,
      maxSizeBytes: MAX_SNAPSHOT_SIZE,
    };
    return res.status(200).json(payload);
  } catch (error: any) {
    console.error('[snapshots/upload-url] Signed URL Error:', error);
    return res.status(500).json({ error: error?.message ? String(error.message) : 'Internal Server Error' });
  }
}

