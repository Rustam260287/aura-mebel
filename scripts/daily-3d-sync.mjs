#!/usr/bin/env node
/**
 * Daily 3D Sync Agent
 * Запускается каждый день через Windows Task Scheduler.
 * Находит продукты с фото но без 3D → генерирует GLB + USDZ → обновляет Firestore.
 *
 * Лог: logs/daily-3d-sync.log
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'daily-3d-sync.log');
const LOCK_FILE = path.join(LOGS_DIR, 'daily-3d-sync.lock');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
process.env.FIRESTORE_PREFER_REST = 'true';

fs.mkdirSync(LOGS_DIR, { recursive: true });

// ── Логгер ────────────────────────────────────────────────────────────────────

const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
};

const appendRawLog = (msg) => {
  fs.appendFileSync(LOG_FILE, msg);
};

// Ротация лога: оставляем последние 500 строк
const rotateLogs = () => {
  try {
    if (!fs.existsSync(LOG_FILE)) return;
    const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n');
    if (lines.length > 500) {
      fs.writeFileSync(LOG_FILE, lines.slice(-500).join('\n'));
    }
  } catch {}
};

const acquireLock = () => {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const existingPid = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      if (existingPid) {
        log(`⚠️ Найден lock-файл предыдущего запуска (PID ${existingPid}). Продолжаю и перезаписываю lock.`);
      }
    }
    fs.writeFileSync(LOCK_FILE, String(process.pid));
  } catch (err) {
    log(`⚠️ Не удалось создать lock-файл: ${err.message}`);
  }
};

const releaseLock = () => {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch (err) {
    log(`⚠️ Не удалось удалить lock-файл: ${err.message}`);
  }
};

// ── Firebase ──────────────────────────────────────────────────────────────────

const serviceAccount =
  process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : fs.existsSync(path.join(PROJECT_ROOT, 'serviceAccountKey.json'))
      ? JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'serviceAccountKey.json'), 'utf8'))
      : null;

if (!serviceAccount) {
  log('❌ ОШИБКА: нет serviceAccountKey.json или FIREBASE_SERVICE_ACCOUNT');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// ── Проверка что нужно обработать ─────────────────────────────────────────────

const findProductsNeedingWork = async () => {
  const needs3D = [];
  const needsUsdz = [];

  const snap = await db.collection('products').get();

  snap.docs.forEach(doc => {
    const d = doc.data();
    const hasPhoto = d.imageUrls?.length > 0 || d.imageUrl;

    if (!hasPhoto) return; // Нет фото — пропускаем

    // Нужна 3D модель
    if (!d.has3D || !d.modelGlbUrl) {
      needs3D.push(doc.id);
      return;
    }

    // Есть GLB, но нет USDZ
    const proc = d.modelProcessing;
    const hasUsdz = d.modelUsdzUrl &&
      (typeof proc !== 'object' || proc?.usdz?.status === 'READY');
    if (!hasUsdz) {
      needsUsdz.push(doc.id);
    }
  });

  return { needs3D, needsUsdz };
};

// ── Запуск дочернего скрипта ──────────────────────────────────────────────────

const runScript = (scriptName, args) =>
  new Promise((resolve) => {
    const startedAt = Date.now();
    const proc = spawn('node', [
      path.join(PROJECT_ROOT, 'scripts', scriptName),
      ...args,
    ], {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let out = '';
    let err = '';
    const prefix = `[child:${scriptName}] `;

    proc.stdout.on('data', d => {
      const text = d.toString();
      out += text;
      process.stdout.write(d);
      appendRawLog(text.split(/\r?\n/).filter(Boolean).map(line => `${prefix}${line}\n`).join(''));
    });
    proc.stderr.on('data', d => {
      const text = d.toString();
      err += text;
      process.stderr.write(d);
      appendRawLog(text.split(/\r?\n/).filter(Boolean).map(line => `${prefix}${line}\n`).join(''));
    });

    proc.on('error', (spawnError) => {
      log(`  ❌ Не удалось запустить ${scriptName}: ${spawnError.message}`);
      resolve({ code: null, signal: null, out, err: err || spawnError.message });
    });

    proc.on('close', (code, signal) => {
      const durationSec = ((Date.now() - startedAt) / 1000).toFixed(1);
      log(`  ℹ️ ${scriptName} завершён: code=${code ?? 'null'} signal=${signal ?? 'none'} time=${durationSec}s`);
      resolve({ code, signal, out, err });
    });
  });

// ── Основной цикл ─────────────────────────────────────────────────────────────

const main = async () => {
  rotateLogs();
  acquireLock();
  log('═══════════════════════════════════');
  log('🤖 Daily 3D Sync — старт');

  // 1. Проверяем что нужно сделать
  log('🔍 Проверяем продукты...');
  const { needs3D, needsUsdz } = await findProductsNeedingWork();

  log(`📦 Нужна 3D модель:   ${needs3D.length} продуктов`);
  log(`📦 Нужна USDZ:        ${needsUsdz.length} продуктов`);

  if (needs3D.length === 0 && needsUsdz.length === 0) {
    log('✅ Всё актуально, работа не нужна');
    log('═══════════════════════════════════\n');
    releaseLock();
    process.exit(0);
  }

  let totalSuccess = 0;
  let totalError = 0;

  // 2. Генерируем 3D для новых продуктов (по одному — не перегружаем API)
  if (needs3D.length > 0) {
    log(`\n🧊 Генерация 3D для ${needs3D.length} продуктов...`);
    for (const id of needs3D) {
      log(`  → [${id}]`);
      const { code, signal, err } = await runScript('generate-3d-agent.mjs', ['--object', id]);
      if (code === 0) {
        log(`  ✅ [${id}] готово`);
        totalSuccess++;
      } else {
        const detail = signal ? `signal=${signal}` : `код ${code}`;
        const tail = err.trim().split(/\r?\n/).filter(Boolean).slice(-1)[0];
        log(`  ❌ [${id}] ошибка (${detail})${tail ? `: ${tail}` : ''}`);
        totalError++;
      }
      // Пауза между запросами к Replicate
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  // 3. Генерируем USDZ для тех у кого есть GLB но нет USDZ
  if (needsUsdz.length > 0) {
    log(`\n🔧 USDZ конвертация для ${needsUsdz.length} продуктов...`);
    for (const id of needsUsdz) {
      log(`  → [${id}]`);
      const { code, signal, err } = await runScript('usdz-agent.mjs', ['--object', id]);
      if (code === 0) {
        log(`  ✅ [${id}] готово`);
        totalSuccess++;
      } else {
        const detail = signal ? `signal=${signal}` : `код ${code}`;
        const tail = err.trim().split(/\r?\n/).filter(Boolean).slice(-1)[0];
        log(`  ❌ [${id}] ошибка (${detail})${tail ? `: ${tail}` : ''}`);
        totalError++;
      }
    }
  }

  // 4. Итог
  log(`\n📊 Итог: ✅ ${totalSuccess} | ❌ ${totalError}`);
  log('═══════════════════════════════════\n');
  releaseLock();
  process.exit(totalError > 0 ? 1 : 0);
};

process.on('SIGINT', () => {
  log('⚠️ Получен SIGINT, завершаю задачу.');
  releaseLock();
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('⚠️ Получен SIGTERM, завершаю задачу.');
  releaseLock();
  process.exit(143);
});

process.on('uncaughtException', (err) => {
  log(`💥 uncaughtException: ${err.message}`);
  releaseLock();
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  log(`💥 unhandledRejection: ${message}`);
  releaseLock();
  process.exit(1);
});

main().catch(err => {
  log(`💥 Критическая ошибка: ${err.message}`);
  releaseLock();
  process.exit(1);
});
