import type { NextApiRequest, NextApiResponse } from 'next';
import { checkIsAdmin } from '../../../lib/auth/admin-check';
import { getAdminStorage } from '../../../lib/firebaseAdmin';

type UploadModelUrlRequest = {
  filename?: string;
  size?: number;
  extension?: string;
  contentType?: string;
};

type UploadModelUrlResponse = {
  uploadUrl: string;
  filePath: string;
  contentType: string;
  kind: 'glb' | 'usdz';
  maxSizeBytes: number;
};

const MAX_MODEL_SIZE = 100 * 1024 * 1024; // 100MB

const normalizeExtension = (value: unknown): 'glb' | 'usdz' | undefined => {
  if (typeof value !== 'string') return undefined;
  const ext = value.trim().toLowerCase().replace(/^\./, '');
  if (ext === 'glb' || ext === 'usdz') return ext;
  return undefined;
};

const inferModelKind = (contentType: unknown, extension: unknown, filename: unknown): 'glb' | 'usdz' | undefined => {
  const ct = typeof contentType === 'string' ? contentType.toLowerCase().split(';')[0].trim() : '';
  const ext = normalizeExtension(extension);
  const nameExt =
    typeof filename === 'string' ? normalizeExtension(filename.split('.').pop()?.toLowerCase()) : undefined;

  if (ct === 'model/gltf-binary') return 'glb';
  if (ct === 'model/vnd.usdz+zip') return 'usdz';
  if (ext === 'glb' || ext === 'usdz') return ext;
  if (nameExt === 'glb' || nameExt === 'usdz') return nameExt;

  return undefined;
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
    console.warn('[upload-model-url] Failed to ensure bucket CORS:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const isAdmin = await checkIsAdmin(req);
  if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

  const body = (req.body || {}) as UploadModelUrlRequest;
  const size = typeof body.size === 'number' ? body.size : undefined;
  if (typeof size === 'number' && Number.isFinite(size) && size > MAX_MODEL_SIZE) {
    return res.status(413).json({ error: 'File too large' });
  }

  const kind = inferModelKind(body.contentType, body.extension, body.filename);
  if (!kind) return res.status(415).json({ error: 'Unsupported file type' });

  const storage = getAdminStorage();
  if (!storage) return res.status(500).json({ error: 'Storage not initialized' });
  const bucket = storage.bucket();

  await ensureBucketCors(bucket);

  const contentType = kind === 'glb' ? 'model/gltf-binary' : 'model/vnd.usdz+zip';
  const filename = `models/${Date.now()}_${Math.floor(Math.random() * 10000)}.${kind}`;
  const file = bucket.file(filename);

  try {
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    const payload: UploadModelUrlResponse = {
      uploadUrl,
      filePath: filename,
      contentType,
      kind,
      maxSizeBytes: MAX_MODEL_SIZE,
    };
    return res.status(200).json(payload);
  } catch (error: any) {
    console.error('Signed URL Error:', error);
    return res.status(500).json({ error: error?.message ? String(error.message) : 'Internal Server Error' });
  }
}

