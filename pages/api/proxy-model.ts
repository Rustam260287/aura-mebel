import type { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const ALLOWED_HOSTS = new Set(['firebasestorage.googleapis.com', 'storage.googleapis.com']);

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, ETag');
}

function inferContentType(targetUrl: string, upstreamContentType: string | null) {
  const cleanUrl = targetUrl.split('?')[0]?.toLowerCase() || '';
  if (cleanUrl.endsWith('.usdz')) return 'model/vnd.usdz+zip';
  if (cleanUrl.endsWith('.glb')) return 'model/gltf-binary';
  if (cleanUrl.endsWith('.gltf')) return 'model/gltf+json';
  return upstreamContentType || 'application/octet-stream';
}

function inferFilename(targetUrl: string, contentType: string) {
  try {
    const u = new URL(targetUrl);
    const lastSegment = decodeURIComponent(u.pathname).split('/').pop();
    if (lastSegment) return lastSegment;
  } catch {
    // ignore
  }
  if (contentType === 'model/vnd.usdz+zip') return 'model.usdz';
  if (contentType === 'model/gltf-binary') return 'model.glb';
  if (contentType === 'model/gltf+json') return 'model.gltf';
  return 'model';
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[/\\\\]/g, '_').replace(/["]/g, "'");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET,HEAD,OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return res.status(400).json({ error: 'Invalid URL protocol' });
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return res.status(400).json({ error: 'URL host is not allowed' });
  }

  const range = typeof req.headers.range === 'string' ? req.headers.range : undefined;

  try {
    const upstream = await fetch(target.toString(), {
      method: req.method,
      headers: range ? { Range: range } : undefined,
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream responded with ${upstream.status}` });
    }

    const contentType = inferContentType(target.toString(), upstream.headers.get('content-type'));
    const filename = sanitizeFilename(inferFilename(target.toString(), contentType));

    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);
    const disposition = contentType === 'model/vnd.usdz+zip' ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const contentLength = upstream.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    const acceptRanges = upstream.headers.get('accept-ranges');
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);

    const contentRange = upstream.headers.get('content-range');
    if (contentRange) res.setHeader('Content-Range', contentRange);

    const etag = upstream.headers.get('etag');
    if (etag) res.setHeader('ETag', etag);

    const lastModified = upstream.headers.get('last-modified');
    if (lastModified) res.setHeader('Last-Modified', lastModified);

    if (req.method === 'HEAD') return res.end();

    if (!upstream.body) return res.end();
    await pipeline(Readable.fromWeb(upstream.body as any), res);
  } catch (error) {
    console.error('Proxy Model Error:', error);
    res.status(500).json({ error: 'Failed to proxy model' });
  }
}
