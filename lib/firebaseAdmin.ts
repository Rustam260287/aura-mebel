// lib/firebaseAdmin.ts
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App | null = null;

// Эта функция гарантирует, что SDK инициализируется только один раз.
const ensureFirebaseAdminInitialized = (): App | null => {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  // SDK автоматически использует переменную окружения GOOGLE_APPLICATION_CREDENTIALS,
  // если она установлена, поэтому нам не нужно вручную обрабатывать ключ.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn('Переменная окружения GOOGLE_APPLICATION_CREDENTIALS не задана. Firebase Admin SDK не будет инициализирован.');
    return null;
  }

  if (!projectId) {
    console.warn('Переменная окружения FIREBASE_PROJECT_ID не задана. Firebase Admin SDK не будет инициализирован.');
    return null;
  }

  try {
    console.log('Инициализация Firebase Admin SDK...');
    adminApp = initializeApp({
      storageBucket: `${projectId}.appspot.com`,
    });
    console.log('Firebase Admin SDK успешно инициализирован.');
    return adminApp;
  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА: Не удалось инициализировать Firebase Admin SDK:', error instanceof Error ? error.message : error);
    return null;
  }
};

// Инициализируем сразу при загрузке модуля.
ensureFirebaseAdminInitialized();

// Экспортируемые функции для получения доступа к сервисам.
export const getAdminDb = (): Firestore | null => {
  return adminApp ? getFirestore(adminApp) : null;
};

export const getAdminStorage = (): Storage | null => {
  return adminApp ? getStorage(adminApp) : null;
};
