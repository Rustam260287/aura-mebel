
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// --- ИСПРАВЛЕНО: Используем правильное имя бакета ---
const BUCKET_NAME = 'aura-mebel-7ec96.firebasestorage.app';

export const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  let serviceAccount;

  if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("Firebase Admin SDK инициализируется из переменной окружения (Production)...");
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error("Критическая ошибка: не удалось распарсить FIREBASE_SERVICE_ACCOUNT.", e);
      throw new Error("Переменная FIREBASE_SERVICE_ACCOUNT содержит некорректный JSON.");
    }
  } else {
    console.log("Firebase Admin SDK инициализируется из файла serviceAccountKey.json (Development)...");
    try {
      const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error("Файл serviceAccountKey.json не найден в корне проекта.");
      }
      const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountFile);
    } catch (error: any) {
      console.error('Критическая ошибка: не удалось прочитать serviceAccountKey.json.', error.message);
      throw new Error("Не удалось инициализировать Firebase Admin SDK для локальной разработки.");
    }
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: BUCKET_NAME,
  });
};

export const getAdminDb = () => {
  if (admin.apps.length === 0) {
    initializeFirebaseAdmin();
  }
  return admin.firestore();
};
