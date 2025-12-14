
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

  // 1. Сначала пробуем получить ключ из переменной окружения (работает и в Prod, и в Dev)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("Firebase Admin SDK: Инициализация из переменной окружения FIREBASE_SERVICE_ACCOUNT...");
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error("Критическая ошибка: не удалось распарсить FIREBASE_SERVICE_ACCOUNT.", e);
      throw new Error("Переменная FIREBASE_SERVICE_ACCOUNT содержит некорректный JSON.");
    }
  } 
  // 2. Если переменной нет, ищем файл serviceAccountKey.json (обычно в Dev)
  else {
    console.log("Firebase Admin SDK: Инициализация из файла serviceAccountKey.json...");
    try {
      const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (!fs.existsSync(serviceAccountPath)) {
        console.error(`Файл не найден по пути: ${serviceAccountPath}`);
        throw new Error("Файл serviceAccountKey.json не найден в корне проекта. Пожалуйста, скачайте его из Firebase Console -> Project Settings -> Service Accounts и положите в корень проекта.");
      }
      const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountFile);
    } catch (error: any) {
      console.error('Критическая ошибка при чтении ключа:', error.message);
      // Пробрасываем ошибку дальше, чтобы Next.js показал её
      throw error; 
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

export const getAdminStorage = () => {
  if (admin.apps.length === 0) {
    initializeFirebaseAdmin();
  }
  return admin.storage();
};

// --- НОВАЯ ФУНКЦИЯ ---
export const getAdminAuth = () => {
  if (admin.apps.length === 0) {
    initializeFirebaseAdmin();
  }
  return admin.auth();
};
