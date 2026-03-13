#!/usr/bin/env node
/**
 * Регистрирует daily-3d-sync в Windows Task Scheduler.
 * Запускать один раз: node scripts/setup-scheduler.mjs
 *
 * Задача запускается каждый день в 03:00 (когда ноут обычно не используется).
 * Если в 03:00 ноут выключен — задача запустится при следующем включении.
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..').replace(/\//g, '\\');
const SCRIPT = `${PROJECT_ROOT}\\scripts\\daily-3d-sync.mjs`;
const NODE = process.execPath;
const TASK_NAME = 'AuraMebel-3DSync';

const cmd = `schtasks /Create /F /TN "${TASK_NAME}" /TR "\\"${NODE}\\" \\"${SCRIPT}\\"" /SC DAILY /ST 03:00 /RU "${process.env.USERNAME}" /RL HIGHEST /IT`;

console.log('Регистрирую задачу в Task Scheduler...');
console.log(`Имя задачи: ${TASK_NAME}`);
console.log(`Скрипт:     ${SCRIPT}`);
console.log(`Расписание: каждый день в 03:00\n`);

try {
  execSync(cmd, { stdio: 'inherit', shell: true });
  console.log('\n✅ Задача зарегистрирована!');
  console.log('\nПроверить: Пуск → Task Scheduler → Task Scheduler Library → AuraMebel-3DSync');
  console.log('Запустить вручную: schtasks /Run /TN "AuraMebel-3DSync"');
  console.log(`Лог: ${PROJECT_ROOT}\\logs\\daily-3d-sync.log`);
} catch (err) {
  console.error('❌ Ошибка регистрации:', err.message);
  console.error('Попробуй запустить от имени администратора.');
  process.exit(1);
}
