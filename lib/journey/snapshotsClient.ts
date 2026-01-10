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

  // New Metadata
  timestamp: number;
  device?: 'android' | 'ios' | 'web';
  arMode?: 'webxr' | 'quick-look' | 'scene-viewer';
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
  device?: 'android' | 'ios' | 'web';
  arMode?: 'webxr' | 'quick-look' | 'scene-viewer';
};

const clampSnapshotBytes = (value: number, max: number) => {
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.min(max, Math.max(1, Math.round(value)));
};

export async function createArSnapshot({ sessionId, objectId, partnerId, capture, device, arMode }: CreateSnapshotArgs) {
  const size = clampSnapshotBytes(capture.blob.size, 12 * 1024 * 1024);
  const timestamp = Date.now();

  const uploadRes = await fetch('/api/snapshots/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      size,
      contentType: capture.blob.type || 'image/jpeg',
      timestamp, // Optional, for path generation consistency if needed
    }),
  });

  const uploadJson = (await uploadRes.json().catch(() => ({}))) as UploadUrlResponse & { error?: string };
  if (!uploadRes.ok) {
    throw new Error(uploadJson?.error || `Upload URL failed: HTTP ${uploadRes.status}`);
  }

  // Robust upload with 1 retry
  let put: Response | null = null;
  let lastError: unknown;

  for (let i = 0; i < 2; i++) {
    try {
      put = await fetch(uploadJson.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': uploadJson.contentType },
        body: capture.blob,
      });
      if (put.ok) break;
    } catch (e) {
      lastError = e;
      // Wait briefly before retry
      if (i === 0) await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (!put || !put.ok) {
    const suffix = lastError instanceof Error ? `: ${lastError.message}` : '';
    throw new Error(`Snapshot upload failed after retries${suffix}`);
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
    timestamp,
    ...(partnerId ? { partnerId } : {}),
    ...(typeof width === 'number' ? { width } : {}),
    ...(typeof height === 'number' ? { height } : {}),
    ...(orientation ? { orientation } : {}),
    ...(device ? { device } : {}),
    ...(arMode ? { arMode } : {}),
  };

  // Finalize is critical but if it fails we just log it, 
  // the file is already uploaded. 
  // Ideally we want to link it in DB.
  const finalizeRes = await fetch('/api/snapshots/finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(finalizeBody),
  });

  if (!finalizeRes.ok) {
    // We don't throw here for Quiet UX if the upload succeeded. 
    // Just log a warning that metadata wasn't saved.
    console.warn('[Snapshot] Finalize failed, but upload succeeded.');
  }

  return { filePath: uploadJson.filePath };
}
