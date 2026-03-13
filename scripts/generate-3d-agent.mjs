#!/usr/bin/env node
/**
 * 3D Generation Agent
 * Пайплайн: фото объекта → Trellis (GLB с текстурами PBR) → Blender (USDZ)
 *
 * Использование:
 *   node scripts/generate-3d-agent.mjs --object <id>   # один объект
 *   node scripts/generate-3d-agent.mjs --all            # все без 3D модели
 *   node scripts/generate-3d-agent.mjs --all --limit 10 # первые 10
 *   node scripts/generate-3d-agent.mjs --all --dry      # без изменений
 *   node scripts/generate-3d-agent.mjs --skip-usdz      # только GLB, без USDZ
 *
 * Требования:
 *   - serviceAccountKey.json или FIREBASE_SERVICE_ACCOUNT
 *   - REPLICATE_API_TOKEN в .env.local
 *   - Blender 5.x (для USDZ)
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';
import Replicate from 'replicate';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });

// ── Auth ──────────────────────────────────────────────────────────────────────

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

if (!process.env.REPLICATE_API_TOKEN) {
  console.error('❌ Нужен REPLICATE_API_TOKEN в .env.local');
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
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun    = args.includes('--dry');
const skipUsdz  = args.includes('--skip-usdz');
const processAll = args.includes('--all');

const targetId = (() => {
  const idx = args.findIndex(a => a === '--object' || a === '--id');
  return idx !== -1 ? args[idx + 1] : null;
})();

const limit = (() => {
  const idx = args.findIndex(a => a === '--limit');
  return idx !== -1 ? parseInt(args[idx + 1], 10) : 20;
})();

if (!targetId && !processAll) {
  console.error('Usage: node scripts/generate-3d-agent.mjs --object <id> | --all [--limit N] [--dry] [--skip-usdz]');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

const withRetry = async (fn, retries = 3, delay = 15000) => {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0 && (err.message.includes('429') || err.message.includes('503'))) {
      console.log(`   ⏳ Rate limit, жду ${delay / 1000}с...`);
      await sleep(delay);
      return withRetry(fn, retries - 1, delay * 1.5);
    }
    throw err;
  }
};

const fetchBuffer = async (url) => {
  if (typeof url === 'string') {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return Buffer.from(await res.arrayBuffer());
  }
  const chunks = [];
  for await (const chunk of url) chunks.push(chunk);
  return Buffer.concat(chunks);
};

const toDataUri = async (url) => {
  const buf = await fetchBuffer(url);
  return `data:image/png;base64,${buf.toString('base64')}`;
};

// ── Trellis 3D generation ─────────────────────────────────────────────────────

const TRELLIS_MODEL = 'firtoz/trellis';

const generateWithTrellis = async (imageUrl) => {
  const model = await replicate.models.get('firtoz', 'trellis');
  const versionId = model.latest_version.id;

  const output = await withRetry(() =>
    replicate.run(`${TRELLIS_MODEL}:${versionId}`, {
      input: {
        images: [imageUrl],
        generate_model: true,
        generate_color: false,
        generate_normal: false,
        texture_size: 1024,        // 1024 — баланс качество/размер (макс 2048)
        mesh_simplify: 0.95,       // 0.95 — минимальное упрощение, максимум деталей
        ss_sampling_steps: 12,
        slat_sampling_steps: 12,
        ss_guidance_strength: 7.5,
        slat_guidance_strength: 3.0,
        randomize_seed: true,
        return_no_background: false,
      },
    }), 3, 30000
  );

  // Trellis возвращает объект с полями: model_file, color_video, etc.
  const glbUrl = output?.model_file || (Array.isArray(output) ? output[0] : output);
  if (!glbUrl) throw new Error('Trellis не вернул GLB файл');
  return glbUrl;
};

// ── Storage ───────────────────────────────────────────────────────────────────

const uploadGlb = async (buffer, objectId) => {
  const destPath = `models/${objectId}/original.glb`;
  const file = bucket.file(destPath);
  await file.save(buffer, {
    metadata: {
      contentType: 'model/gltf-binary',
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${destPath}`;
};

// ── Blender USDZ ──────────────────────────────────────────────────────────────

const BLENDER_PATH =
  process.env.BLENDER_PATH ||
  'C:/Program Files/Blender Foundation/Blender 5.0/blender.exe';
const CONVERT_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'convert_glb_to_usdz.py');

const convertToUsdz = (glbPath, usdzPath) =>
  new Promise((resolve, reject) => {
    if (!fs.existsSync(BLENDER_PATH)) {
      return reject(new Error(`Blender не найден: ${BLENDER_PATH}`));
    }
    const proc = spawn(
      BLENDER_PATH,
      ['--background', '--python', CONVERT_SCRIPT, '--', glbPath, usdzPath],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    proc.stdout.on('data', d => process.stdout.write(d));
    proc.stderr.on('data', d => process.stderr.write(d));
    proc.on('close', code => {
      if (code === 0 && fs.existsSync(usdzPath) && fs.statSync(usdzPath).size > 0) {
        resolve(usdzPath);
      } else {
        reject(new Error(`Blender завершился с кодом ${code}`));
      }
    });
  });

const uploadUsdz = async (localPath, objectId) => {
  const destPath = `models/${objectId}/ios.usdz`;
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

// ── Core pipeline ─────────────────────────────────────────────────────────────

const processObject = async (docSnap, tmpDir) => {
  const data = docSnap.data();
  const id = docSnap.id;
  const name = data.name || '(без названия)';
  const imageUrl = data.imageUrls?.[0] || data.imageUrl;

  console.log(`\n📦 [${id}] ${name}`);

  if (!imageUrl) {
    console.log(`   ⏭  Нет фото, пропускаем`);
    return { id, status: 'skipped', reason: 'no_image' };
  }

  if (dryRun) {
    console.log(`   [dry] rembg → tripo-sr → GLB → USDZ`);
    console.log(`   [dry] фото: ${imageUrl}`);
    return { id, status: 'dry' };
  }

  const localGlb = path.join(tmpDir, `${id}.glb`);
  const localUsdz = path.join(tmpDir, `${id}.usdz`);

  try {
    // ── Шаг 1: Генерация 3D с текстурами (Trellis) ───────────────────────
    process.stdout.write(`   🧊 Генерируем 3D (Trellis)...`);
    await db.collection('products').doc(id).update({ modelProcessing: 'GENERATING' }).catch(() => {});

    const glbOutput = await generateWithTrellis(imageUrl);
    console.log(` ✅`);

    // ── Шаг 3: Загрузка GLB ───────────────────────────────────────────────
    process.stdout.write(`   ⬆️  Загружаем GLB...`);
    const glbBuffer = await fetchBuffer(glbOutput);
    fs.writeFileSync(localGlb, glbBuffer);
    const glbUrl = await uploadGlb(glbBuffer, id);
    const glbMB = (glbBuffer.length / 1024 / 1024).toFixed(1);
    console.log(` ${glbMB} MB ✅`);

    // Обновляем Firestore после GLB
    await db.collection('products').doc(id).update({
      modelGlbUrl: glbUrl,
      has3D: true,
      modelProcessing: skipUsdz ? 'READY_WITHOUT_IOS' : 'OPTIMIZED',
    });

    // ── Шаг 4: Конвертация в USDZ ─────────────────────────────────────────
    if (!skipUsdz) {
      process.stdout.write(`   🔧 Конвертируем в USDZ (Blender)...\n`);
      try {
        await convertToUsdz(localGlb, localUsdz);
        const usdzMB = (fs.statSync(localUsdz).size / 1024 / 1024).toFixed(1);

        process.stdout.write(`   ⬆️  Загружаем USDZ...`);
        const usdzUrl = await uploadUsdz(localUsdz, id);
        console.log(` ${usdzMB} MB ✅`);

        await db.collection('products').doc(id).update({
          modelUsdzUrl: usdzUrl,
          modelProcessing: 'READY',
          usdzGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`   💾 Firestore: READY`);
        return { id, status: 'success', glbUrl, usdzUrl };
      } catch (usdzErr) {
        console.warn(`   ⚠️  USDZ не удался: ${usdzErr.message}`);
        await db.collection('products').doc(id).update({
          modelProcessing: 'READY_WITHOUT_IOS',
        });
        return { id, status: 'success_no_ios', glbUrl };
      }
    }

    console.log(`   💾 Firestore: READY_WITHOUT_IOS`);
    return { id, status: 'success_no_ios', glbUrl };

  } catch (err) {
    console.error(`   ❌ Ошибка: ${err.message}`);
    await db.collection('products').doc(id).update({ modelProcessing: 'ERROR' }).catch(() => {});
    return { id, status: 'error', reason: err.message };
  } finally {
    for (const f of [localGlb, localUsdz]) {
      try { fs.unlinkSync(f); } catch {}
    }
  }
};

// ── Main ──────────────────────────────────────────────────────────────────────

const main = async () => {
  const tmpDir = path.join(os.tmpdir(), 'generate-3d-agent');
  fs.mkdirSync(tmpDir, { recursive: true });

  console.log('🤖 3D Generation Agent');
  console.log(`   Режим:    ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`   USDZ:     ${skipUsdz ? 'пропускаем' : 'включён (Blender)'}`);
  if (targetId) console.log(`   Объект:   ${targetId}`);
  if (processAll) console.log(`   Лимит:    ${limit}`);
  console.log('');

  let docs = [];

  if (targetId) {
    const snap = await db.collection('products').doc(targetId).get();
    if (!snap.exists) {
      // Попробуем старую коллекцию products
      const snap2 = await db.collection('products').doc(targetId).get();
      if (!snap2.exists) { console.error(`❌ Объект ${targetId} не найден`); process.exit(1); }
      docs = [snap2];
    } else {
      docs = [snap];
    }
  } else {
    // Все объекты без 3D модели
    const snap = await db.collection('products')
      .where('has3D', '!=', true)
      .limit(limit)
      .get();
    docs = snap.docs;

    if (docs.length === 0) {
      // Попробуем без фильтра (has3D может отсутствовать как поле)
      const snap2 = await db.collection('products').limit(limit).get();
      docs = snap2.docs.filter(d => !d.data().modelGlbUrl && !d.data().model3dUrl);
    }
  }

  console.log(`📦 Объектов для обработки: ${docs.length}\n`);

  const results = { success: 0, success_no_ios: 0, skipped: 0, error: 0, dry: 0 };

  for (let i = 0; i < docs.length; i++) {
    const result = await processObject(docs[i], tmpDir);
    results[result.status] = (results[result.status] || 0) + 1;

    if (i < docs.length - 1 && !dryRun) {
      process.stdout.write(`   💤 Пауза 5с...\n`);
      await sleep(5000);
    }
  }

  console.log('\n─────────────────────────────────');
  console.log('📊 Итого:');
  console.log(`   ✅ GLB + USDZ:  ${results.success}`);
  console.log(`   📦 Только GLB:  ${results.success_no_ios}`);
  console.log(`   ⏭  Пропущено:   ${results.skipped}`);
  console.log(`   ❌ Ошибок:      ${results.error}`);
  if (dryRun) console.log(`   🔍 Dry run:     ${results.dry}`);

  try { fs.rmdirSync(tmpDir); } catch {}
};

main().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
