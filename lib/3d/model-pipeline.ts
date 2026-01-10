import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { spawn } from 'node:child_process';
import gltfPipeline from 'gltf-pipeline';
import sharp from 'sharp';
import { validateBytes } from 'gltf-validator';
import { getAdminDb, getAdminStorage } from '../firebaseAdmin';
import { COLLECTIONS } from '../db/collections';
import type { ModelProcessingInfo, ModelProcessingStatus } from '../../types';

const MAX_TEXTURE_SIZE = Number(process.env.LABELCOM_MAX_TEXTURE_SIZE || 2048);
const TARGET_GLB_MAX_BYTES = Number(process.env.LABELCOM_TARGET_GLB_MAX_BYTES || 10 * 1024 * 1024);
const JPEG_QUALITY = Number(process.env.LABELCOM_JPEG_QUALITY || 85);
// Support AURA prefixed env vars, fallback to LABELCOM for backward compatibility
const USDZ_CONVERTER_URL = process.env.AURA_USDZ_CONVERTER_URL?.trim() || process.env.LABELCOM_USDZ_CONVERTER_URL?.trim() || '';
const PROCESSOR_URL = process.env.AURA_3D_PROCESSOR_URL?.trim() || USDZ_CONVERTER_URL;
const USDZ_CONVERTER_TOKEN = process.env.AURA_USDZ_CONVERTER_TOKEN?.trim() || process.env.LABELCOM_USDZ_CONVERTER_TOKEN?.trim() || '';
const USDZ_CONVERTER_TIMEOUT_MS = Number(process.env.AURA_USDZ_CONVERTER_TIMEOUT_MS || process.env.LABELCOM_USDZ_CONVERTER_TIMEOUT_MS || 240_000);

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const padTo4 = (buffer: Buffer, padByte: number) => {
  const pad = (4 - (buffer.length % 4)) % 4;
  return pad ? Buffer.concat([buffer, Buffer.alloc(pad, padByte)]) : buffer;
};

const clampNumber = (value: unknown, min: number, max: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

function fixAccessorMinMaxForValidator(glb: Buffer): Buffer {
  if (glb.toString('utf8', 0, 4) !== 'glTF') return glb;

  const jsonChunkLength = glb.readUInt32LE(12);
  const jsonChunkType = glb.readUInt32LE(16);
  if (jsonChunkType !== 0x4e4f534a) return glb;

  const jsonStart = 20;
  const jsonEnd = jsonStart + jsonChunkLength;
  let gltf: any;
  try {
    gltf = JSON.parse(glb.slice(jsonStart, jsonEnd).toString('utf8'));
  } catch {
    return glb;
  }

  const accessors = Array.isArray(gltf?.accessors) ? gltf.accessors : [];
  let changed = false;

  for (const accessor of accessors) {
    if (!accessor || typeof accessor !== 'object') continue;
    const componentType = Number(accessor.componentType);
    let minAllowed: number | null = null;
    let maxAllowed: number | null = null;

    switch (componentType) {
      case 5120: // BYTE
        minAllowed = -128;
        maxAllowed = 127;
        break;
      case 5121: // UNSIGNED_BYTE
        minAllowed = 0;
        maxAllowed = 255;
        break;
      case 5122: // SHORT
        minAllowed = -32768;
        maxAllowed = 32767;
        break;
      case 5123: // UNSIGNED_SHORT
        minAllowed = 0;
        maxAllowed = 65535;
        break;
      case 5125: // UNSIGNED_INT
        minAllowed = 0;
        maxAllowed = 4294967295;
        break;
      default:
        break;
    }

    if (minAllowed == null || maxAllowed == null) continue;

    if (Array.isArray(accessor.max)) {
      const next = accessor.max.map((v: unknown) => clampNumber(v, minAllowed!, maxAllowed!));
      if (JSON.stringify(next) !== JSON.stringify(accessor.max)) {
        accessor.max = next;
        changed = true;
      }
    }

    if (Array.isArray(accessor.min)) {
      const next = accessor.min.map((v: unknown) => clampNumber(v, minAllowed!, maxAllowed!));
      if (JSON.stringify(next) !== JSON.stringify(accessor.min)) {
        accessor.min = next;
        changed = true;
      }
    }
  }

  if (!changed) return glb;

  const binHeaderOffset = jsonEnd;
  const binChunkLength = glb.readUInt32LE(binHeaderOffset);
  const binChunkType = glb.readUInt32LE(binHeaderOffset + 4);
  if (binChunkType !== 0x004e4942) return glb;

  const binStart = binHeaderOffset + 8;
  const binEnd = binStart + binChunkLength;
  const binChunk = glb.slice(binStart, binEnd);

  const jsonText = JSON.stringify(gltf);
  const jsonChunk = padTo4(Buffer.from(jsonText, 'utf8'), 0x20);
  const paddedBinChunk = padTo4(Buffer.from(binChunk), 0x00);

  const totalLength = 12 + 8 + jsonChunk.length + 8 + paddedBinChunk.length;
  const header = Buffer.alloc(12);
  header.write('glTF', 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(paddedBinChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, paddedBinChunk]);
}

type TextureRewriteStats = {
  resized: number;
  convertedToJpeg: number;
  processed: number;
};

async function rewriteEmbeddedTextures(glb: Buffer): Promise<{ glb: Buffer; stats: TextureRewriteStats }> {
  const stats: TextureRewriteStats = { resized: 0, convertedToJpeg: 0, processed: 0 };
  if (!Number.isFinite(MAX_TEXTURE_SIZE) || MAX_TEXTURE_SIZE <= 0) return { glb, stats };

  if (glb.toString('utf8', 0, 4) !== 'glTF') {
    throw new Error('Invalid GLB (missing magic header)');
  }

  const jsonChunkLength = glb.readUInt32LE(12);
  const jsonChunkType = glb.readUInt32LE(16);
  if (jsonChunkType !== 0x4e4f534a) {
    throw new Error('Invalid GLB (missing JSON chunk)');
  }

  const jsonStart = 20;
  const jsonEnd = jsonStart + jsonChunkLength;
  const gltf = JSON.parse(glb.slice(jsonStart, jsonEnd).toString('utf8')) as Record<string, any>;

  const binHeaderOffset = jsonEnd;
  const binChunkLength = glb.readUInt32LE(binHeaderOffset);
  const binChunkType = glb.readUInt32LE(binHeaderOffset + 4);
  if (binChunkType !== 0x004e4942) {
    // No BIN chunk (rare) — nothing to rewrite.
    return { glb, stats };
  }

  const binStart = binHeaderOffset + 8;
  const bin = glb.slice(binStart, binStart + binChunkLength);

  const images = Array.isArray(gltf.images) ? (gltf.images as any[]) : [];
  const bufferViews = Array.isArray(gltf.bufferViews) ? (gltf.bufferViews as any[]) : [];

  const replacements = new Map<number, Buffer>();

  for (const image of images) {
    if (!image || typeof image !== 'object') continue;
    if (typeof image.bufferView !== 'number') continue;
    const bufferViewIndex = image.bufferView as number;
    const view = bufferViews[bufferViewIndex];
    if (!view || typeof view !== 'object') continue;
    if (!isFiniteNumber(view.byteLength)) continue;
    if (view.buffer != null && view.buffer !== 0) continue;

    const start = Number(view.byteOffset || 0);
    const end = start + Number(view.byteLength);
    const imageBytes = bin.slice(start, end);

    let meta: sharp.Metadata;
    try {
      meta = await sharp(imageBytes).metadata();
    } catch {
      continue;
    }

    const width = Number(meta.width || 0);
    const height = Number(meta.height || 0);
    const maxDim = Math.max(width, height);
    if (!Number.isFinite(maxDim) || maxDim <= 0) continue;

    const hasAlpha = Boolean(meta.hasAlpha);
    const mimeIn = typeof image.mimeType === 'string' ? image.mimeType.toLowerCase().split(';')[0].trim() : '';
    const shouldResize = maxDim > MAX_TEXTURE_SIZE;
    const shouldConvertToJpeg = !hasAlpha && (mimeIn === 'image/png' || mimeIn === 'image/webp' || !mimeIn);

    if (!shouldResize && !shouldConvertToJpeg) continue;

    const pipeline = sharp(imageBytes).resize({
      width: MAX_TEXTURE_SIZE,
      height: MAX_TEXTURE_SIZE,
      fit: 'inside',
      withoutEnlargement: true,
    });

    let out: Buffer;
    if (hasAlpha) {
      out = await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
      image.mimeType = 'image/png';
    } else {
      out = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
      image.mimeType = 'image/jpeg';
      if (mimeIn !== 'image/jpeg') stats.convertedToJpeg += 1;
    }

    stats.processed += 1;
    if (shouldResize) stats.resized += 1;
    replacements.set(bufferViewIndex, out);
  }

  if (replacements.size === 0) return { glb, stats };

  let cursor = 0;
  const newBinParts: Buffer[] = [];

  for (let i = 0; i < bufferViews.length; i += 1) {
    const view = bufferViews[i];
    if (!view || typeof view !== 'object') continue;
    if (view.buffer != null && view.buffer !== 0) continue;

    const originalStart = Number(view.byteOffset || 0);
    const originalEnd = originalStart + Number(view.byteLength || 0);
    const replacement = replacements.get(i);
    const bytes = replacement ? Buffer.from(replacement) : bin.slice(originalStart, originalEnd);

    view.byteOffset = cursor;
    view.byteLength = bytes.length;
    newBinParts.push(bytes);
    cursor += bytes.length;

    const pad = (4 - (cursor % 4)) % 4;
    if (pad) {
      newBinParts.push(Buffer.alloc(pad));
      cursor += pad;
    }
  }

  if (Array.isArray(gltf.buffers) && gltf.buffers[0]) {
    gltf.buffers[0].byteLength = cursor;
  }

  const jsonText = JSON.stringify(gltf);
  const jsonChunk = padTo4(Buffer.from(jsonText, 'utf8'), 0x20);
  const binChunk = padTo4(Buffer.concat(newBinParts), 0x00);

  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.write('glTF', 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return { glb: Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]), stats };
}

const trySpawn = (program: string, args: string[]) =>
  new Promise<{ ok: boolean; code: number | null }>((resolve) => {
    const child = spawn(program, args, { stdio: 'inherit' });
    child.on('close', (code) => resolve({ ok: code === 0, code }));
    child.on('error', () => resolve({ ok: false, code: null }));
  });

type UsdzConverterResponse = {
  ok?: boolean;
  usdzUrl?: string;
  usdzSizeBytes?: number;
  error?: string;
  details?: string;
};

async function optimizeGlbRemotely(params: {
  glbUrl: string;
}): Promise<{ ok: boolean; buffer?: Buffer; error?: string }> {
  if (!PROCESSOR_URL) return { ok: false, error: '3D Processor is not configured' };

  const base = PROCESSOR_URL.replace(/\/+$/, '');
  const endpoint = `${base}/optimize`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 120_000);

  try {
    const iamHeaders = await getCloudRunAuthHeaders(base);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...iamHeaders,
      },
      body: JSON.stringify({ glbUrl: params.glbUrl }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      return { ok: false, error: json?.error || `Processor error (${res.status})` };
    }

    const arrayBuffer = await res.arrayBuffer();
    return { ok: true, buffer: Buffer.from(arrayBuffer) };
  } catch (error: any) {
    return { ok: false, error: error?.message || 'Optimization failed' };
  } finally {
    clearTimeout(t);
  }
}

async function getCloudRunAuthHeaders(audienceUrl: string): Promise<Record<string, string>> {
  try {
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth();
    const client = await auth.getIdTokenClient(audienceUrl);
    const headers = await client.getRequestHeaders();
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === 'string') out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

async function generateUsdzRemotely(params: {
  bucket: string;
  glbUrl: string;
  usdzPath: string;
}): Promise<{ ok: boolean; usdzUrl?: string; sizeBytes?: number; error?: string }> {
  if (!USDZ_CONVERTER_URL) {
    return { ok: false, error: 'USDZ converter is not configured' };
  }

  const base = USDZ_CONVERTER_URL.replace(/\/+$/, '');
  const endpoint = `${base}/convert`;
  const controller = new AbortController();
  const timeoutMs = Number.isFinite(USDZ_CONVERTER_TIMEOUT_MS) && USDZ_CONVERTER_TIMEOUT_MS > 0 ? USDZ_CONVERTER_TIMEOUT_MS : 240_000;
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const iamHeaders = await getCloudRunAuthHeaders(base);
    console.log(`[model-pipeline] Calling USDZ converter: ${endpoint} for ${params.glbUrl}`);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...iamHeaders,
        ...(USDZ_CONVERTER_TOKEN ? { 'x-labelcom-token': USDZ_CONVERTER_TOKEN } : {}),
      },
      body: JSON.stringify({ glbUrl: params.glbUrl }),
      signal: controller.signal,
    });

    if (!res.ok) {
      // Try to parse error JSON
      const json = await res.json().catch(() => null);
      const message =
        (json?.error && String(json.error)) ||
        `USDZ converter error (${res.status})`;
      return { ok: false, error: message };
    }

    const contentType = res.headers.get('content-type') || '';

    // Handle Binary Response (Simple Converter)
    if (contentType.includes('model/vnd.usdz+zip') || contentType.includes('application/octet-stream')) {
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const sizeBytes = buffer.length;

      if (sizeBytes === 0) {
        return { ok: false, error: 'Converter returned empty USDZ' };
      }

      const storage = getAdminStorage();
      if (!storage) throw new Error('Storage not initialized');
      const bucketObj = storage.bucket(params.bucket);
      const file = bucketObj.file(params.usdzPath);

      await file.save(buffer, {
        metadata: {
          contentType: 'model/vnd.usdz+zip',
          contentDisposition: 'inline',
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });
      await file.makePublic();
      const usdzUrl = `https://storage.googleapis.com/${params.bucket}/${params.usdzPath}`;

      return { ok: true, usdzUrl, sizeBytes };
    }

    // Handle JSON Response (Legacy / Complex Worker)
    const data = (await res.json().catch(() => null)) as UsdzConverterResponse | null;
    if (!data?.ok) {
      const message = (data?.error && String(data.error)) || (data?.details && String(data.details)) || 'USDZ conversion failed (unknown)';
      return { ok: false, error: message };
    }

    const usdzUrl = typeof data.usdzUrl === 'string' ? data.usdzUrl : undefined;
    const sizeBytes = typeof data.usdzSizeBytes === 'number' && Number.isFinite(data.usdzSizeBytes) ? data.usdzSizeBytes : undefined;
    return { ok: true, usdzUrl, sizeBytes };

  } catch (error: any) {
    const message = error?.name === 'AbortError' ? 'USDZ conversion timed out' : error?.message ? String(error.message) : 'USDZ conversion failed';
    return { ok: false, error: message };
  } finally {
    clearTimeout(t);
  }
}

async function generateUsdz(inputGlbPath: string, outputUsdzPath: string): Promise<boolean> {
  const usdConvert = process.env.USDCONVERT_PATH?.trim() || '';
  if (usdConvert) {
    const extra = (process.env.USDCONVERT_ARGS || '').split(' ').map((v) => v.trim()).filter(Boolean);
    const res = await trySpawn(usdConvert, [...extra, inputGlbPath, outputUsdzPath]);
    return res.ok;
  }

  const usdFromGltf = process.env.USD_FROM_GLTF_PATH?.trim() || '';
  if (usdFromGltf) {
    const res = await trySpawn(usdFromGltf, [inputGlbPath, outputUsdzPath]);
    return res.ok;
  }

  const xcrun = process.env.XCRUN_USD_CONVERTER?.trim() || '';
  if (xcrun) {
    const res = await trySpawn('xcrun', [xcrun, inputGlbPath, outputUsdzPath]);
    return res.ok;
  }

  const blender = process.env.BLENDER_PATH?.trim() || 'blender';
  const scriptPath =
    process.env.LABELCOM_BLENDER_USDZ_SCRIPT?.trim() || path.join(process.cwd(), 'scripts/convert_glb_to_usdz.py');
  if (blender && scriptPath) {
    const res = await trySpawn(blender, ['--background', '--python', scriptPath, '--', inputGlbPath, outputUsdzPath]);
    return res.ok;
  }

  return false;
}

const nowIso = () => new Date().toISOString();

async function updateModelProcessing(objectId: string, patch: any) {
  const db = getAdminDb();
  if (!db) throw new Error('Database not initialized');

  // We use dot notation for merging to preserve other fields if needed, 
  // but since we are restructuring, we might just set the whole object
  await db.collection(COLLECTIONS.objects).doc(objectId).set(
    {
      modelProcessing: {
        ...patch,
        updatedAt: nowIso(),
      },
      updatedAt: nowIso(),
    },
    { merge: true }
  );
}

/**
 * GLB Pipeline:
 * Upload -> Remote Optimize -> READY
 */
export async function runGlbPipeline(objectId: string): Promise<void> {
  const db = getAdminDb();
  const storage = getAdminStorage();
  if (!db || !storage) throw new Error('Firebase not initialized');

  const bucket = storage.bucket();
  const docRef = db.collection(COLLECTIONS.objects).doc(objectId);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error('Object not found');

  const originalPath = `models/${objectId}/original.glb`;
  const optimizedPath = `models/${objectId}/optimized.glb`;

  try {
    // 1. Initial State
    await updateModelProcessing(objectId, {
      glb: {
        status: 'OPTIMIZING',
        originalUrl: `https://storage.googleapis.com/${bucket.name}/${originalPath}`,
        updatedAt: nowIso(),
      }
    });

    const originalFile = bucket.file(originalPath);
    await originalFile.makePublic();
    const originalUrl = `https://storage.googleapis.com/${bucket.name}/${originalPath}`;

    // Get original size
    const [meta] = await originalFile.getMetadata();
    const originalSize = Number(meta.size);

    // 2. Call Remote Processor
    console.log(`[glb-pipeline] Optimizing ${objectId} via ${PROCESSOR_URL}`);
    const optResult = await optimizeGlbRemotely({ glbUrl: originalUrl });

    if (!optResult.ok || !optResult.buffer) {
      throw new Error(optResult.error || 'Remote optimization failed');
    }

    // 3. Save Optimized GLB
    const optimizedFile = bucket.file(optimizedPath);
    await optimizedFile.save(optResult.buffer, {
      metadata: {
        contentType: 'model/gltf-binary',
        cacheControl: 'public, max-age=31536000, immutable',
      }
    });
    await optimizedFile.makePublic();
    const optimizedUrl = `https://storage.googleapis.com/${bucket.name}/${optimizedPath}`;

    // 4. Final Update
    await updateModelProcessing(objectId, {
      glb: {
        status: 'READY',
        url: optimizedUrl,
        originalUrl: originalUrl,
        sizeBytes: optResult.buffer.length,
        originalSizeBytes: originalSize,
        updatedAt: nowIso(),
      },
      platforms: {
        web: true,
        android: true,
        ios: Boolean(doc.data()?.modelProcessing?.usdz?.status === 'READY')
      }
    });

    // Also update top-level field for convenience
    await docRef.update({
      modelGlbUrl: optimizedUrl,
      has3D: true,
      updatedAt: nowIso()
    });

  } catch (error: any) {
    console.error(`[glb-pipeline] Error for ${objectId}:`, error);
    await updateModelProcessing(objectId, {
      glb: {
        status: 'ERROR',
        error: error.message,
        updatedAt: nowIso(),
      }
    });
  }
}

/**
 * USDZ Pipeline:
 * Manual Upload -> Optional Optimization -> READY_WITH_IOS
 * (Implementation for manual upload UI will be separate)
 */
export async function runUsdzPipeline(objectId: string): Promise<void> {
  const db = getAdminDb();
  const storage = getAdminStorage();
  if (!db || !storage) throw new Error('Firebase not initialized');

  const bucket = storage.bucket();
  const usdzPath = `models/${objectId}/ios.usdz`;
  const usdzFile = bucket.file(usdzPath);

  try {
    const [exists] = await usdzFile.exists();
    if (!exists) throw new Error('USDZ file not found in storage');

    await usdzFile.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${usdzPath}`;
    const [meta] = await usdzFile.getMetadata();

    await updateModelProcessing(objectId, {
      usdz: {
        status: 'READY',
        url: url,
        sizeBytes: Number(meta.size),
        updatedAt: nowIso(),
      },
      platforms: {
        web: true,
        android: true,
        ios: true
      }
    });

    // Update top-level field
    await db.collection(COLLECTIONS.objects).doc(objectId).update({
      modelUsdzUrl: url,
      updatedAt: nowIso()
    });

  } catch (error: any) {
    console.error(`[usdz-pipeline] Error for ${objectId}:`, error);
    await updateModelProcessing(objectId, {
      usdz: {
        status: 'ERROR',
        error: error.message,
        updatedAt: nowIso(),
      }
    });
  }
}

// Alias for legacy calls if needed, pointing to the primary GLB pipeline
export const runModelProcessingPipeline = runGlbPipeline;

