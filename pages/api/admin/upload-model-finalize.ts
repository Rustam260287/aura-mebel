import type { NextApiRequest, NextApiResponse } from 'next';
import { checkIsAdmin } from '../../../lib/auth/admin-check';
import { getAdminStorage } from '../../../lib/firebaseAdmin';

type FinalizeRequest = {
  filePath?: string;
  contentType?: string;
};

const isAllowedPath = (filePath: string): boolean => {
  if (!filePath.startsWith('models/')) return false;
  if (filePath.includes('..')) return false;
  return true;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const isAdmin = await checkIsAdmin(req);
  if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

  const body = (req.body || {}) as FinalizeRequest;
  const filePath = typeof body.filePath === 'string' ? body.filePath.trim() : '';
  const contentTypeRaw = typeof body.contentType === 'string' ? body.contentType.trim() : '';

  if (!filePath || !isAllowedPath(filePath)) {
    return res.status(400).json({ error: 'Invalid filePath' });
  }

  const storage = getAdminStorage();
  if (!storage) return res.status(500).json({ error: 'Storage not initialized' });
  const bucket = storage.bucket();
  const file = bucket.file(filePath);

  const ext = filePath.split('.').pop()?.toLowerCase();
  const contentType =
    contentTypeRaw ||
    (ext === 'glb' ? 'model/gltf-binary' : ext === 'usdz' ? 'model/vnd.usdz+zip' : 'application/octet-stream');

  try {
    await file.setMetadata({
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    });
    await file.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    return res.status(200).json({ url });
  } catch (error: any) {
    console.error('Finalize upload error:', error);
    return res.status(500).json({ error: error?.message ? String(error.message) : 'Internal Server Error' });
  }
}

