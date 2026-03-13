#!/usr/bin/env node
/**
 * USDZ Agent — скачивает GLB из Firebase Storage, конвертирует в USDZ через Blender,
 * загружает обратно и обновляет Firestore.
 *
 * Использование:
 *   node scripts/usdz-agent.mjs              # обработать все объекты без USDZ
 *   node scripts/usdz-agent.mjs --object <id> # один объект
 *   node scripts/usdz-agent.mjs --dry         # только показать, без изменений
 *
 * Требования:
 *   - serviceAccountKey.json в корне проекта (или FIREBASE_SERVICE_ACCOUNT)
 *   - Blender 5.x установлен (BLENDER_PATH или стандартный путь)
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ── Auth ─────────────────────────────────────────────────────────────────────

const serviceAccount =
  process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : fs.existsSync(path.join(PROJECT_ROOT, 'serviceAccountKey.json'))
      ? JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'serviceAccountKey.json'), 'utf8'))
      : null;

if (!serviceAccount) {
  console.error('❌ Нужен serviceAccountKey.json или FIREBASE_SERVICE_ACCOUNT');
  process.exit(1);
}

process.env.FIRESTORE_PREFER_REST = 'true';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');
const targetId = (() => {
  const idx = args.findIndex(a => a === '--object' || a === '--id');
  return idx !== -1 ? args[idx + 1] : null;
})();

// ── Blender ───────────────────────────────────────────────────────────────────

const BLENDER_PATH =
  process.env.BLENDER_PATH ||
  'C:/Program Files/Blender Foundation/Blender 5.0/blender.exe';

const CONVERT_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'convert_glb_to_usdz.py');

const convertWithBlender = (inputGlb, outputUsdz) =>
  new Promise((resolve, reject) => {
    if (!fs.existsSync(BLENDER_PATH)) {
      return reject(new Error(`Blender не найден: ${BLENDER_PATH}`));
    }

    const proc = spawn(
      BLENDER_PATH,
      ['--background', '--python', CONVERT_SCRIPT, '--', inputGlb, outputUsdz],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );

    let out = '';
    proc.stdout.on('data', d => { out += d; process.stdout.write(d); });
    proc.stderr.on('data', d => process.stderr.write(d));

    proc.on('close', code => {
      if (code === 0 && fs.existsSync(outputUsdz) && fs.statSync(outputUsdz).size > 0) {
        resolve(outputUsdz);
      } else {
        reject(new Error(`Blender завершился с кодом ${code}`));
      }
    });
  });

// ── Storage helpers ───────────────────────────────────────────────────────────

const parseStoragePath = (url) => {
  if (!url) return null;
  if (url.startsWith('gs://')) {
    const parts = url.slice('gs://'.length).split('/').filter(Boolean);
    return parts.slice(1).join('/') || null;
  }
  try {
    const parsed = new URL(url);
    const [, objectPath] = parsed.pathname.split('/o/');
    if (objectPath) return decodeURIComponent(objectPath);
    if (parsed.hostname === 'storage.googleapis.com') {
      return parsed.pathname.split('/').filter(Boolean).slice(1).join('/');
    }
  } catch {}
  return null;
};

const downloadFile = async (storagePath, localPath) => {
  await bucket.file(storagePath).download({ destination: localPath });
  return localPath;
};

const uploadFile = async (localPath, destPath) => {
  const file = bucket.file(destPath);
  await file.save(fs.readFileSync(localPath), {
    metadata: {
      contentType: 'model/vnd.usdz+zip',
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${destPath}`;
};

// ── Main logic ────────────────────────────────────────────────────────────────

const processObject = async (docSnap, tmpDir) => {
  const data = docSnap.data();
  const id = docSnap.id;
  const glbUrl = data.modelGlbUrl || data.model3dUrl;

  if (!glbUrl) {
    console.log(`  ⏭  [${id}] нет GLB URL, пропускаем`);
    return { id, status: 'skipped', reason: 'no_glb' };
  }

  const storagePath = parseStoragePath(glbUrl);
  if (!storagePath) {
    console.log(`  ⚠️  [${id}] не удалось распарсить Storage path из: ${glbUrl}`);
    return { id, status: 'error', reason: 'bad_url' };
  }

  const localGlb = path.join(tmpDir, `${id}.glb`);
  const localUsdz = path.join(tmpDir, `${id}.usdz`);
  const destPath = `models/${id}/ios.usdz`;

  console.log(`\n🔄 [${id}] ${data.name || '(без названия)'}`);
  console.log(`   GLB: ${storagePath}`);

  if (dryRun) {
    console.log(`   [dry] конвертация: ${localGlb} → ${localUsdz}`);
    console.log(`   [dry] загрузка в: ${destPath}`);
    return { id, status: 'dry' };
  }

  try {
    // 1. Скачать GLB
    process.stdout.write(`   ⬇️  Скачиваем GLB...`);
    await downloadFile(storagePath, localGlb);
    const sizeMB = (fs.statSync(localGlb).size / 1024 / 1024).toFixed(1);
    console.log(` ${sizeMB} MB`);

    // 2. Конвертировать через Blender
    process.stdout.write(`   🔧 Конвертируем через Blender...\n`);
    await convertWithBlender(localGlb, localUsdz);
    const usdzMB = (fs.statSync(localUsdz).size / 1024 / 1024).toFixed(1);
    console.log(`   ✅ USDZ готов: ${usdzMB} MB`);

    // 3. Загрузить в Storage
    process.stdout.write(`   ⬆️  Загружаем USDZ...`);
    const publicUrl = await uploadFile(localUsdz, destPath);
    console.log(` OK`);
    console.log(`   🔗 ${publicUrl}`);

    // 4. Обновить Firestore
    await db.collection('products').doc(id).update({
      modelUsdzUrl: publicUrl,
      'modelProcessing.usdz': {
        url: publicUrl,
        status: 'READY',
        updatedAt: new Date().toISOString(),
      },
      usdzGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`   💾 Firestore обновлён`);

    return { id, status: 'success', url: publicUrl };
  } catch (err) {
    console.error(`   ❌ Ошибка: ${err.message}`);
    return { id, status: 'error', reason: err.message };
  } finally {
    for (const f of [localGlb, localUsdz]) {
      try { fs.unlinkSync(f); } catch {}
    }
  }
};

const main = async () => {
  const tmpDir = path.join(os.tmpdir(), 'usdz-agent');
  fs.mkdirSync(tmpDir, { recursive: true });

  console.log('🤖 USDZ Agent запущен');
  console.log(`   Blender: ${BLENDER_PATH}`);
  console.log(`   Режим: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (targetId) console.log(`   Объект: ${targetId}`);
  console.log('');

  let query;
  if (targetId) {
    const snap = await db.collection('products').doc(targetId).get();
    if (!snap.exists) {
      console.error(`❌ Объект ${targetId} не найден`);
      process.exit(1);
    }
    query = [snap];
  } else {
    // Все продукты у которых есть GLB, но нет USDZ
    const snap = await db.collection('products')
      .where('has3D', '==', true)
      .get();
    query = snap.docs.filter(d => {
      const data = d.data();
      const glbUrl = data.modelGlbUrl;
      const usdzUrl = data.modelUsdzUrl;
      const proc = data.modelProcessing;
      // Есть GLB но нет USDZ, или статус usdz не READY
      if (!glbUrl) return false;
      if (!usdzUrl) return true;
      if (proc && typeof proc === 'object' && proc.usdz?.status !== 'READY') return true;
      return false;
    });
  }

  console.log(`📦 Найдено объектов для обработки: ${query.length}\n`);

  const results = { success: 0, skipped: 0, error: 0, dry: 0 };

  for (const doc of query) {
    const result = await processObject(doc, tmpDir);
    results[result.status] = (results[result.status] || 0) + 1;
  }

  console.log('\n─────────────────────────────');
  console.log('📊 Итого:');
  console.log(`   ✅ Успешно:  ${results.success}`);
  console.log(`   ⏭  Пропущено: ${results.skipped}`);
  console.log(`   ❌ Ошибок:  ${results.error}`);
  if (dryRun) console.log(`   🔍 Dry run: ${results.dry}`);

  try { fs.rmdirSync(tmpDir); } catch {}
};

main().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
