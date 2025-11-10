// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

// Эта функция будет нашим единственным способом получить доступ к БД на сервере.
export function getAdminDb() {
  // Если приложение уже инициализировано, просто возвращаем инстанс БД.
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  // Если нет - проводим инициализацию.
  try {
    const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
    if (!privateKeyBase64) {
      throw new Error('FIREBASE_PRIVATE_KEY_BASE64 is not defined.');
    }
    const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('ascii');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });

    console.log('[ADMIN SDK] Lazy initialization successful.');
    return admin.firestore();

  } catch (error) {
    console.error('[ADMIN SDK] CRITICAL: Lazy initialization failed:', error);
    // Возвращаем null в случае критической ошибки.
    return null;
  }
}
