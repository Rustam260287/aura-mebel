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

async function updateModelProcessing(objectId: string, patch: Partial<ModelProcessingInfo>) {
  const db = getAdminDb();
  if (!db) throw new Error('Database not initialized');
  await db
    .collection(COLLECTIONS.objects)
    .doc(objectId)
    .set(
      {
        modelProcessing: {
          ...(patch as any),
          updatedAt: nowIso(),
        },
        updatedAt: nowIso(),
      },
      { merge: true },
    );
}

export async function runModelProcessingPipeline(objectId: string): Promise<void> {
  const db = getAdminDb();
  const storage = getAdminStorage();
  if (!db) throw new Error('Database not initialized');
  if (!storage) throw new Error('Storage not initialized');

  const bucket = storage.bucket();
  const docRef = db.collection(COLLECTIONS.objects).doc(objectId);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error('Object not found');

  const originalPath = `models/${objectId}/original.glb`;
  const optimizedPath = `models/${objectId}/optimized.glb`;
  const usdzPath = `models/${objectId}/ios.usdz`;

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `labelcom-3d-${objectId}-`));
  const tmpOriginal = path.join(tmpDir, 'original.glb');
  const tmpOptimized = path.join(tmpDir, 'optimized.glb');
  const tmpUsdz = path.join(tmpDir, 'ios.usdz');

  const cleanup = async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch { }
  };

  try {
    const originalFile = bucket.file(originalPath);
    const [origMeta] = await originalFile.getMetadata().catch(() => [{ size: undefined } as any]);
    const sizeBeforeBytes = origMeta?.size ? Number(origMeta.size) : undefined;

    await updateModelProcessing(objectId, {
      status: 'OPTIMIZING',
      startedAt: nowIso(),
      sizeBeforeBytes: Number.isFinite(sizeBeforeBytes) ? sizeBeforeBytes : undefined,
      maxTextureSize: MAX_TEXTURE_SIZE,
      original: {
        storagePath: originalPath,
        ...(Number.isFinite(sizeBeforeBytes) ? { sizeBytes: sizeBeforeBytes } : {}),
      },
      platforms: { web: false, android: false, ios: false },
    });

    await originalFile.makePublic();
    const originalUrl = `https://storage.googleapis.com/${bucket.name}/${originalPath}`;

    // --- STEP 1: OPTIMIZE GLB REMOTELY ---
    const optResult = await optimizeGlbRemotely({ glbUrl: originalUrl });
    if (!optResult.ok || !optResult.buffer) {
      throw new Error(`Remote optimization failed: ${optResult.error}`);
    }

    const finalGlb = optResult.buffer;
    await fs.writeFile(tmpOptimized, finalGlb);

    const sizeAfterBytes = finalGlb.length;
    if (Number.isFinite(TARGET_GLB_MAX_BYTES) && TARGET_GLB_MAX_BYTES > 0 && sizeAfterBytes > TARGET_GLB_MAX_BYTES) {
      await updateModelProcessing(objectId, {
        status: 'ERROR',
        sizeAfterBytes,
        error: `GLB слишком большой после оптимизации (${Math.round(sizeAfterBytes / 1024 / 1024)} MB). Цель: ≤ ${Math.round(
          TARGET_GLB_MAX_BYTES / 1024 / 1024,
        )} MB.`,
        finishedAt: nowIso(),
      });
      return;
    }

    const validation = await validateBytes(new Uint8Array(finalGlb));
    const numErrors = validation?.issues?.numErrors || 0;
    if (numErrors > 0) {
      await updateModelProcessing(objectId, {
        status: 'ERROR',
        sizeAfterBytes,
        error: `glTF Validator: ${numErrors} ошибок.`,
        finishedAt: nowIso(),
      });
      return;
    }

    await updateModelProcessing(objectId, {
      status: 'OPTIMIZED',
      sizeAfterBytes,
    });

    const optimizedFile = bucket.file(optimizedPath);
    await optimizedFile.save(finalGlb, {
      metadata: {
        contentType: 'model/gltf-binary',
        contentDisposition: 'inline',
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });
    await optimizedFile.makePublic();
    const optimizedUrl = `https://storage.googleapis.com/${bucket.name}/${optimizedPath}`;

    await docRef.set(
      {
        modelGlbUrl: optimizedUrl,
        has3D: true,
        updatedAt: nowIso(),
        modelProcessing: {
          status: 'OPTIMIZED',
          sizeBeforeBytes: Number.isFinite(sizeBeforeBytes) ? sizeBeforeBytes : undefined,
          sizeAfterBytes,
          maxTextureSize: MAX_TEXTURE_SIZE,
          optimized: { storagePath: optimizedPath, url: optimizedUrl, sizeBytes: sizeAfterBytes },
          platforms: { web: true, android: true, ios: false },
          updatedAt: nowIso(),
        },
      },
      { merge: true },
    );

    await updateModelProcessing(objectId, { status: 'GENERATING_USDZ' });

    let usdzUrl: string | undefined;
    let usdzSizeBytes: number | undefined;
    let usdzError: string | undefined;

    if (USDZ_CONVERTER_URL) {
      const remote = await generateUsdzRemotely({
        bucket: bucket.name,
        glbUrl: optimizedUrl,
        usdzPath,
      });
      if (remote.ok) {
        usdzUrl = remote.usdzUrl || `https://storage.googleapis.com/${bucket.name}/${usdzPath}`;
        usdzSizeBytes = remote.sizeBytes;
      } else {
        usdzError = remote.error || 'USDZ generation failed';
        console.warn(`[model-pipeline] Remote USDZ conversion failed: ${usdzError}`);
      }
    } else {
      // Gracefully skip USDZ generation if no converter is configured.
      // Do NOT attempt local fallbacks to avoid ENOENT/subprocess errors in production envs.
      console.info('[model-pipeline] USDZ converter not configured, skipping iOS generation.');
      // Keep usdzUrl undefined -> Status becomes READY_WITHOUT_IOS
    }

    const finalStatus: ModelProcessingStatus = usdzUrl ? 'READY' : 'READY_WITHOUT_IOS';

    await docRef.set(
      {
        ...(usdzUrl ? { modelUsdzUrl: usdzUrl } : {}),
        has3D: true,
        updatedAt: nowIso(),
        modelProcessing: {
          status: finalStatus,
          finishedAt: nowIso(),
          platforms: { web: true, android: true, ios: Boolean(usdzUrl) },
          ...(usdzUrl ? { usdz: { storagePath: usdzPath, url: usdzUrl, ...(Number.isFinite(usdzSizeBytes) ? { sizeBytes: usdzSizeBytes } : {}) } } : {}),
          ...(usdzUrl ? { error: null } : usdzError ? { error: usdzError } : {}),
          updatedAt: nowIso(),
        },
      },
      { merge: true },
    );
  } catch (error: any) {
    const message = error?.message ? String(error.message) : 'Model processing failed';
    await updateModelProcessing(objectId, { status: 'ERROR', error: message, finishedAt: nowIso() }).catch(() => null);
  } finally {
    await cleanup();
  }
}
