#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';
import sharp from 'sharp';

/**
 * Скрипт оптимизирует существующие GLB (draco + удаление лишних атрибутов) и, при наличии,
 * конвертирует их в USDZ (через `USDCONVERT_PATH` или `xcrun usdz_converter`).
 * Оптимизированный файл загружается обратно в Firebase Storage, а Firestore-документ обновляется.
 *
 * Использование:
 *   node scripts/optimize-and-upload-3d.mjs --object <id>
 *   node scripts/optimize-and-upload-3d.mjs --product <id> (legacy)
 *   node scripts/optimize-and-upload-3d.mjs --all
 *
 * Перед запуском убедитесь, что:
 * - У вас есть доступный `serviceAccountKey.json` (или переменная FIREBASE_SERVICE_ACCOUNT).
 * - Установлен `gltf-pipeline` (в devDependencies), а `npx gltf-pipeline` доступен.
 * - При необходимости: переменные окружения USDCONVERT_PATH или XCRUN_USD_CONVERTER.
 */

const [, , ...args] = process.argv;

if (args.length === 0) {
  console.error('Usage: node scripts/optimize-and-upload-3d.mjs --object <id> | --all');
  process.exit(1);
}

const options = {
  objectIds: new Set(),
  processAll: false,
  dryRun: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if ((arg === '--object' || arg === '--product') && args[i + 1]) {
    options.objectIds.add(args[++i]);
  } else if (arg === '--all') {
    options.processAll = true;
  } else if (arg === '--dry') {
    options.dryRun = true;
  } else {
    console.warn('Unknown flag:', arg);
  }
}

if (!options.processAll && options.objectIds.size === 0) {
  console.error('Please specify at least one object (--object <id>) or --all.');
  process.exit(1);
}

const serviceAccount =
  process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT !== ''
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : fs.existsSync('./serviceAccountKey.json')
      ? JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'))
      : null;

if (!serviceAccount) {
  throw new Error('Firebase service account is required (FIREBASE_SERVICE_ACCOUNT or serviceAccountKey.json).');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const tmpDir = path.join(os.tmpdir(), 'labelcom-3d-opt');
fs.mkdirSync(tmpDir, { recursive: true });

const MAX_TEXTURE_SIZE = Number(process.env.LABELCOM_MAX_TEXTURE_SIZE || 2048);

const gltfArgs = [
  '-i',
  '', // placeholder
  '-o',
  '', // placeholder
  '-d',
  '--dracoCompressionLevel',
  '7',
  '--dracoQuantizePosition',
  '16384',
  '--dracoQuantizeNormal',
  '4096',
  '--dracoQuantizeTexcoord',
  '4096',
  '--removeUnusedElements',
  '--prioritizeSpeed',
];

const runGltfPipeline = (input, output) =>
  new Promise((resolve, reject) => {
    const args = [...gltfArgs];
    args[1] = input;
    args[3] = output;

    const proc = spawn('npx', ['gltf-pipeline', ...args], { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`gltf-pipeline exited with ${code}`));
    });
  });

const findInPath = (cmd) => {
  const which = process.platform === 'win32' ? 'where' : 'which';
  const res = spawnSync(which, [cmd], { encoding: 'utf8' });
  if (res.status === 0 && res.stdout) {
    const first = res.stdout.split(/\r?\n/).find(Boolean);
    return first?.trim();
  }
  return null;
};

const detectUsdConverterCommand = () => {
  if (process.env.USDCONVERT_PATH) {
    const args = (process.env.USDCONVERT_ARGS || '').split(' ').filter(Boolean);
    return { program: process.env.USDCONVERT_PATH, args };
  }

  if (process.env.USD_FROM_GLTF_PATH) {
    return { program: process.env.USD_FROM_GLTF_PATH, args: [] };
  }

  if (process.platform === 'darwin') {
    return { program: 'xcrun', args: ['usdz_converter'] };
  }

  const usdFromPath = findInPath('usd_from_gltf');
  if (usdFromPath) {
    return { program: usdFromPath, args: [] };
  }

  return null;
};

const runUsdConversion = (input, output) =>
  new Promise((resolve, reject) => {
    const converterCommand = detectUsdConverterCommand();
    if (!converterCommand) {
      console.log('USDZ conversion skipped, set USDCONVERT_PATH, USD_FROM_GLTF_PATH, or run on macOS with xcrun.');
      return resolve(null);
    }

    const args = [...converterCommand.args];
    args.push(input, output);

    const proc = spawn(converterCommand.program, args, { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) return resolve(output);
      console.warn('USDZ conversion failed (code', code, ')');
      resolve(null);
    });
  });

const downloadFile = async (storagePath, downloadPath) => {
  const file = bucket.file(storagePath);
  await file.download({ destination: downloadPath });
  return downloadPath;
};

const uploadFile = async (localPath, destPath, contentType) => {
  const file = bucket.file(destPath);
  await file.save(fs.readFileSync(localPath), {
    metadata: { cacheControl: 'public, max-age=31536000, immutable', contentType },
  });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${destPath}`;
};

const parseStoragePath = (url) => {
  if (!url) return null;
  if (url.startsWith('gs://')) {
    const withoutScheme = url.slice('gs://'.length);
    const parts = withoutScheme.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const [maybeBucket, ...rest] = parts;
    if (maybeBucket === bucket.name) return rest.join('/');
    // Fallback: assume already a bucket-relative path.
    return parts.slice(1).join('/') || null;
  }
  try {
    const parsed = new URL(url);
    // Firebase Storage download URL format:
    // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>
    const [, objectPath] = parsed.pathname.split('/o/');
    if (objectPath) return decodeURIComponent(objectPath);

    // Public GCS URL format:
    // https://storage.googleapis.com/<bucket>/<path>
    if (parsed.hostname === 'storage.googleapis.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length < 2) return null;
      return parts.slice(1).join('/');
    }

    return null;
  } catch (error) {
    console.warn('failed to parse storage path from', url, error);
    return null;
  }
};

const padTo4 = (buffer, padByte = 0x00) => {
  const pad = (4 - (buffer.length % 4)) % 4;
  if (!pad) return buffer;
  return Buffer.concat([buffer, Buffer.alloc(pad, padByte)]);
};

const downscaleEmbeddedTextures = async (inputPath, outputPath) => {
  if (!Number.isFinite(MAX_TEXTURE_SIZE) || MAX_TEXTURE_SIZE <= 0) {
    fs.copyFileSync(inputPath, outputPath);
    return { changed: false, resized: 0 };
  }

  const fileBuffer = fs.readFileSync(inputPath);
  if (fileBuffer.toString('utf8', 0, 4) !== 'glTF') {
    throw new Error('Invalid GLB (missing magic header)');
  }

  const jsonChunkLength = fileBuffer.readUInt32LE(12);
  const jsonChunkType = fileBuffer.readUInt32LE(16);
  if (jsonChunkType !== 0x4E4F534A) {
    throw new Error('Invalid GLB (missing JSON chunk)');
  }
  const jsonStart = 20;
  const jsonEnd = jsonStart + jsonChunkLength;
  const gltf = JSON.parse(fileBuffer.slice(jsonStart, jsonEnd).toString('utf8'));

  const binHeaderOffset = jsonEnd;
  const binChunkLength = fileBuffer.readUInt32LE(binHeaderOffset);
  const binChunkType = fileBuffer.readUInt32LE(binHeaderOffset + 4);
  if (binChunkType !== 0x004E4942) {
    throw new Error('Invalid GLB (missing BIN chunk)');
  }
  const binStart = binHeaderOffset + 8;
  const bin = fileBuffer.slice(binStart, binStart + binChunkLength);

  const images = Array.isArray(gltf.images) ? gltf.images : [];
  const bufferViews = Array.isArray(gltf.bufferViews) ? gltf.bufferViews : [];

  const replacements = new Map();
  let resized = 0;

  for (const image of images) {
    if (typeof image?.bufferView !== 'number') continue;
    const bufferViewIndex = image.bufferView;
    const view = bufferViews[bufferViewIndex];
    if (!view) continue;
    if (typeof view.byteLength !== 'number') continue;
    if (view.buffer != null && view.buffer !== 0) continue;

    const start = Number(view.byteOffset || 0);
    const end = start + Number(view.byteLength);
    const imageBytes = bin.slice(start, end);

    let meta;
    try {
      meta = await sharp(imageBytes).metadata();
    } catch {
      continue;
    }

    const w = Number(meta.width || 0);
    const h = Number(meta.height || 0);
    const maxDim = Math.max(w, h);
    if (!Number.isFinite(maxDim) || maxDim <= 0) continue;
    if (maxDim <= MAX_TEXTURE_SIZE) continue;

    const mime = String(image.mimeType || '').toLowerCase();
    const pipeline = sharp(imageBytes).resize({
      width: MAX_TEXTURE_SIZE,
      height: MAX_TEXTURE_SIZE,
      fit: 'inside',
      withoutEnlargement: true,
    });

    let out;
    if (mime === 'image/jpeg') {
      out = await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
      image.mimeType = 'image/jpeg';
    } else {
      out = await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
      image.mimeType = 'image/png';
    }

    replacements.set(bufferViewIndex, out);
    resized += 1;
  }

  if (replacements.size === 0) {
    fs.copyFileSync(inputPath, outputPath);
    return { changed: false, resized: 0 };
  }

  let cursor = 0;
  const newBinParts = [];
  for (let i = 0; i < bufferViews.length; i++) {
    const view = bufferViews[i];
    if (!view) continue;
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
  jsonHeader.writeUInt32LE(0x4E4F534A, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004E4942, 4);

  fs.writeFileSync(outputPath, Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]));
  return { changed: true, resized };
};

const processObject = async (objectId) => {
  const docRef = db.collection('products').doc(objectId);
  const doc = await docRef.get();
  if (!doc.exists) {
    console.log('skip missing object', objectId);
    return;
  }

  const data = doc.data() || {};
  const sourceUrl = data.modelGlbUrl || data.model3dUrl;
  const storagePath = parseStoragePath(sourceUrl);
  if (!storagePath) {
    console.log('skip, no storage path for', objectId);
    return;
  }

  console.log('processing', objectId, storagePath);

  const tmpSource = path.join(tmpDir, `${objectId}.glb`);
  const tmpOptimized = path.join(tmpDir, `${objectId}.optimized.glb`);
  const tmpFinal = path.join(tmpDir, `${objectId}.optimized.final.glb`);
  await downloadFile(storagePath, tmpSource);

  await runGltfPipeline(tmpSource, tmpOptimized);

  const textureResult = await downscaleEmbeddedTextures(tmpOptimized, tmpFinal);
  if (textureResult.changed) {
    console.log(`textures resized: ${textureResult.resized} (max ${MAX_TEXTURE_SIZE}px)`);
  }

  const destPath = `models/optimized/${objectId}.glb`;
  const newGlbUrl = options.dryRun
    ? sourceUrl
    : await uploadFile(tmpFinal, destPath, 'model/gltf-binary');

  let usdzUrl = data.modelUsdzUrl || data.model3dIosUrl;
  if (!options.dryRun) {
    const usdzOutput = path.join(tmpDir, `${objectId}.usdz`);
    const converted = await runUsdConversion(tmpFinal, usdzOutput);
    if (converted && fs.existsSync(usdzOutput)) {
      usdzUrl = await uploadFile(
        usdzOutput,
        `models/optimized/${objectId}.usdz`,
        'model/vnd.usdz+zip',
      );
    }
  }

  if (!options.dryRun) {
    await docRef.update({
      modelGlbUrl: newGlbUrl,
      modelUsdzUrl: usdzUrl,
      has3D: true,
      model3dOptimizedAt: new Date().toISOString(),
    });
  }
};

const run = async () => {
  const targets = options.processAll
    ? (await db.collection('products').where('has3D', '==', true).get())
        .docs.map(doc => doc.id)
    : Array.from(options.objectIds);

  for (const objectId of targets) {
    await processObject(objectId);
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('error optimizing 3D models', error);
    process.exit(1);
  });
