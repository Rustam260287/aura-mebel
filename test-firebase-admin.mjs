
// test-firebase-admin.mjs
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('--- Запускаю тест инициализации Firebase Admin SDK ---');

try {
  console.log('Пытаюсь инициализировать Firebase Admin...');

  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Одна или несколько переменных окружения для Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) отсутствуют.');
  }
  
  console.log(`Project ID: ${projectId}`);

  if (!admin.credential) {
    throw new Error('`admin.credential` не определен. Проверьте установку `firebase-admin`.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log('\n✅ УСПЕХ: Firebase Admin SDK успешно инициализирован!');

} catch (error) {
  console.error('\n❌ ОШИБКА: Инициализация Firebase Admin SDK не удалась.');
  console.error('Детали ошибки:', error instanceof Error ? error.message : error);
}

console.log('--- Тест завершен ---');
