
import { NextApiRequest, NextApiResponse } from 'next';
import { MediaService } from '../../../lib/media/service';
import { checkIsAdmin } from '../../../lib/auth/admin-check';

export const config = {
  api: {
    bodyParser: false, // Отключаем, чтобы получить stream
  },
};

const MAX_MODEL_SIZE = 100 * 1024 * 1024; // 100MB

const normalizeExtension = (value: unknown): 'glb' | 'usdz' | undefined => {
  if (typeof value !== 'string') return undefined;
  const ext = value.trim().toLowerCase().replace(/^\./, '');
  if (ext === 'glb' || ext === 'usdz') return ext;
  return undefined;
};

const inferModelKind = (contentType: unknown, extension: unknown): 'glb' | 'usdz' | undefined => {
  const ct = typeof contentType === 'string' ? contentType.toLowerCase().split(';')[0].trim() : '';
  const ext = normalizeExtension(extension);

  if (ct === 'model/gltf-binary') return 'glb';
  if (ct === 'model/vnd.usdz+zip') return 'usdz';
  if (ext === 'glb' || ext === 'usdz') return ext;

  return undefined;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Allow', ['POST', 'OPTIONS']);
      return res.status(200).json({ ok: true });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST', 'OPTIONS']);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const isAdmin = await checkIsAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const contentLengthHeader = req.headers['content-length'];
    const contentLength = typeof contentLengthHeader === 'string' ? Number(contentLengthHeader) : undefined;
    if (typeof contentLength === 'number' && Number.isFinite(contentLength) && contentLength > MAX_MODEL_SIZE) {
      return res.status(413).json({ error: 'File too large' });
    }

    const contentType = req.headers['content-type'];
    const extension = req.headers['x-file-extension'];
    const kind = inferModelKind(contentType, extension);
    if (!kind) {
      return res.status(415).json({ error: 'Unsupported file type' });
    }

    const normalizedContentType = kind === 'glb' ? 'model/gltf-binary' : 'model/vnd.usdz+zip';
    const url = await MediaService.uploadStream(req, 'models', normalizedContentType);
    
    return res.status(200).json({ url, kind });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return res.status(500).json({ error: error?.message ? String(error.message) : 'Internal Server Error' });
  }
}
