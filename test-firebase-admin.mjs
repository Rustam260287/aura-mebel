
// test-firebase-admin.mjs
import admin from 'firebase-admin'; // Измененный импорт
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('--- Запускаю тест инициализации Firebase Admin SDK (с измененным импортом) ---');

try {
  console.log('Пытаюсь инициализировать Firebase Admin...');

  const privateKey = (process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Одна или несколько переменных окружения для Firebase Admin отсутствуют.');
  }
  
  console.log(`Project ID: ${projectId}`);

  // Проверяем, существует ли admin.credential
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
  console.error('\n❌ ОШИКА: Инициализация Firebase Admin SDK не удалась.');
  console.error('Детали ошибки:', error.message);
}

console.log('--- Тест завершен ---');
