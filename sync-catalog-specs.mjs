#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config({ path: '.env.local' });

const DRY_RUN = process.env.DRY_RUN === '1'; // безопасный режим по умолчанию
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'serviceAccountKey.json';
const catalogPath = process.env.CATALOG || 'all_products_full.json';
const MATCH_THRESHOLD = Number(process.env.MATCH_THRESHOLD || 0.85);
const REPORT_PATH = path.join('tmp', 'specs-missing.json');

if (!fs.existsSync(catalogPath)) {
  console.error(`Файл каталога ${catalogPath} не найден`);
  process.exit(1);
}

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account file not found:', serviceAccountPath);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

const db = admin.firestore();

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function extractSpecs(desc = '') {
  const text = desc.replace(/\s+/g, ' ');
  // Ищем габариты вида Ш. 2220 В. 1440 Д. 2040 или Ш.*\d+.*Д.*\d+.*В.*\d+
  const dimRegex = /(ш[.\s]*\d{2,4}).{0,20}?(д|г)[.\s]*\d{2,4}.{0,20}?в[.\s]*\d{2,4}/i;
  const match = text.match(dimRegex);
  let dims = '';
  if (match) {
    const nums = match[0].match(/\d{2,4}/g);
    if (nums && nums.length >= 3) {
      dims = `${nums[0]}×${nums[1]}×${nums[2]}`;
    }
  }

  return {
    dimensions: dims || undefined,
  };
}

// читаем каталог
let catalog = [];
try {
  catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
} catch (e) {
  console.error('Не удалось прочитать каталог:', e.message);
  process.exit(1);
}

const catalogNormalized = catalog.map((item) => ({
  ...item,
  _norm: normalizeName(item.name),
  _specs: extractSpecs(item.description || ''),
}));

async function findBestMatch(name) {
  const norm = normalizeName(name);
  let best = null;
  let bestScore = 0;
  for (const item of catalogNormalized) {
    const score = similarity(norm, item._norm);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return { best, score: bestScore };
}

async function main() {
  console.log(`🚀 Подтягиваем характеристики (specs) из каталога ${catalogPath}. DRY_RUN=${DRY_RUN ? 'yes' : 'no'}, threshold=${MATCH_THRESHOLD}`);

  const snapshot = await db.collection('products').get();
  const docs = snapshot.docs;
  const report = [];
  let updated = 0;

  for (const doc of docs) {
    const data = doc.data();
    const currentSpecs = data.specs || {};
    // обновляем только если пусто
    const needsDimensions = !currentSpecs['Габариты (Ш×Г×В)'] || currentSpecs['Габариты (Ш×Г×В)'].includes('уточните');
    if (!needsDimensions) continue;

    const { best, score } = await findBestMatch(data.name);
    if (!best || score < MATCH_THRESHOLD) {
      report.push({ id: doc.id, name: data.name, reason: 'no_match', score });
      continue;
    }

    const specsFromCat = best._specs;
    if (!specsFromCat.dimensions) {
      report.push({ id: doc.id, name: data.name, reason: 'no_dims_in_catalog', match: best.name, score });
      continue;
    }

    const payload = {
      specs: {
        ...currentSpecs,
        'Габариты (Ш×Г×В)': specsFromCat.dimensions,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (DRY_RUN) {
      console.log(`(DRY) ${doc.id} <- ${best.name} (score ${score.toFixed(2)}): dims=${specsFromCat.dimensions}`);
    } else {
      await db.collection('products').doc(doc.id).set(payload, { merge: true });
      console.log(`✅ ${doc.id} обновлен от ${best.name} (score ${score.toFixed(2)})`);
      updated += 1;
    }
  }

  if (report.length) {
    if (!fs.existsSync('tmp')) fs.mkdirSync('tmp');
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`ℹ️ Несовпадения/нет данных записаны в ${REPORT_PATH} (${report.length} шт.)`);
  }

  console.log(`Готово. Обновлено ${updated} товаров${DRY_RUN ? ' (dry-run)' : ''}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
