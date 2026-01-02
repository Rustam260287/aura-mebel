import type { JourneyPlatform } from './eventTypes';

type UploadUrlResponse = {
  uploadUrl: string;
  filePath: string;
  contentType: string;
  maxSizeBytes: number;
};

type FinalizeRequest = {
  filePath: string;
  sessionId: string;
  objectId: string;
  partnerId?: string;
  width?: number;
  height?: number;
  orientation?: 'portrait' | 'landscape';
};

export type SnapshotCapture = {
  blob: Blob;
  width?: number;
  height?: number;
};

export type CreateSnapshotArgs = {
  sessionId: string;
  objectId: string;
  partnerId?: string;
  capture: SnapshotCapture;
  platform?: JourneyPlatform;
};

const clampSnapshotBytes = (value: number, max: number) => {
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.min(max, Math.max(1, Math.round(value)));
};

export async function createArSnapshot({ sessionId, objectId, partnerId, capture }: CreateSnapshotArgs) {
  const size = clampSnapshotBytes(capture.blob.size, 12 * 1024 * 1024);
  const uploadRes = await fetch('/api/snapshots/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      size,
      contentType: capture.blob.type || 'image/jpeg',
    }),
  });

  const uploadJson = (await uploadRes.json().catch(() => ({}))) as UploadUrlResponse & { error?: string };
  if (!uploadRes.ok) {
    throw new Error(uploadJson?.error || `Upload URL failed: HTTP ${uploadRes.status}`);
  }

  let put: Response;
  try {
    put = await fetch(uploadJson.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': uploadJson.contentType },
      body: capture.blob,
    });
  } catch (error) {
    throw new Error(error instanceof Error ? `Upload failed: ${error.message}` : 'Upload failed');
  }

  if (!put.ok) {
    const details = await put.text().catch(() => '');
    const suffix = details ? `: ${details.slice(0, 180)}` : '';
    throw new Error(`Upload failed: HTTP ${put.status}${suffix}`);
  }

  const width = typeof capture.width === 'number' && Number.isFinite(capture.width) ? Math.round(capture.width) : undefined;
  const height = typeof capture.height === 'number' && Number.isFinite(capture.height) ? Math.round(capture.height) : undefined;
  const orientation =
    typeof width === 'number' && typeof height === 'number'
      ? width >= height
        ? 'landscape'
        : 'portrait'
      : undefined;

  const finalizeBody: FinalizeRequest = {
    filePath: uploadJson.filePath,
    sessionId,
    objectId,
    ...(partnerId ? { partnerId } : {}),
    ...(typeof width === 'number' ? { width } : {}),
    ...(typeof height === 'number' ? { height } : {}),
    ...(orientation ? { orientation } : {}),
  };

  const finalizeRes = await fetch('/api/snapshots/finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(finalizeBody),
  });
  const finalizeJson = (await finalizeRes.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!finalizeRes.ok) {
    const details = finalizeJson?.error || (await finalizeRes.text().catch(() => ''));
    throw new Error(details ? String(details) : `Finalize failed: HTTP ${finalizeRes.status}`);
  }
  return { filePath: uploadJson.filePath };
}
