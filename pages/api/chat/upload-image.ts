import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { getAdminStorage } from '../../../lib/firebaseAdmin';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

type UploadResponse = { url: string } | { error: string };

function parseDataUrl(input: string): { mimeType: string; base64: string } | null {
  const match = input.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;
  return { mimeType: match[1] || 'image/jpeg', base64: match[2] || '' };
}

function normalizeMimeType(value: string): string {
  const v = (value || '').toLowerCase().split(';')[0].trim();
  if (v === 'image/jpeg' || v === 'image/jpg') return 'image/jpeg';
  if (v === 'image/png') return 'image/png';
  if (v === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<UploadResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = (req.body || {}) as { image?: unknown };
    if (typeof body.image !== 'string' || !body.image.trim()) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const raw = body.image.trim();
    const parsed = parseDataUrl(raw);
    const mimeType = normalizeMimeType(parsed?.mimeType || 'image/jpeg');
    const base64 = parsed?.base64 || raw.replace(/^data:.*?;base64,/, '');

    const buffer = Buffer.from(base64, 'base64');
    if (!buffer.length) return res.status(400).json({ error: 'Empty image payload' });

    const storage = getAdminStorage();
    const bucket = storage.bucket();

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const filename = `chat-uploads/${randomUUID()}.${ext}`;
    const file = bucket.file(filename);

    await file.save(buffer, {
      resumable: false,
      metadata: {
        contentType: mimeType,
        cacheControl: 'private, max-age=0, no-store',
      },
    });

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    return res.status(200).json({ url: signedUrl });
  } catch (error) {
    console.error('chat upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return res.status(500).json({ error: message });
  }
}

