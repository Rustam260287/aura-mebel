#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';

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
    return url.replace('gs://', '');
  }
  try {
    const parsed = new URL(url);
    const [, objectPath] = parsed.pathname.split('/o/');
    if (!objectPath) return null;
    return decodeURIComponent(objectPath);
  } catch (error) {
    console.warn('failed to parse storage path from', url, error);
    return null;
  }
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
  await downloadFile(storagePath, tmpSource);

  await runGltfPipeline(tmpSource, tmpOptimized);

  const destPath = `models/optimized/${objectId}.glb`;
  const newGlbUrl = options.dryRun
    ? sourceUrl
    : await uploadFile(tmpOptimized, destPath, 'model/gltf-binary');

  let usdzUrl = data.modelUsdzUrl || data.model3dIosUrl;
  if (!options.dryRun) {
    const usdzOutput = path.join(tmpDir, `${objectId}.usdz`);
    const converted = await runUsdConversion(tmpOptimized, usdzOutput);
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
