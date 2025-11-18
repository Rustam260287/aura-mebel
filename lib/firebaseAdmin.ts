// lib/firebaseAdmin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// Проверяем, заданы ли необходимые переменные окружения.
const hasAdminConfig =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

const getServiceAccount = () => {
  if (!hasAdminConfig) {
    console.warn('Переменные окружения для Firebase Admin не заданы. SDK не будет инициализирован.');
    return null;
  }
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Заменяем escape-последовательности \n на реальные переносы строк.
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };
};

let adminApp: App | null = null;

const ensureFirebaseAdminInitialized = (): App | null => {
  // Если инстанс уже создан, возвращаем его.
  if (adminApp) {
    return adminApp;
  }
  
  // Если приложение уже было инициализировано где-то еще, используем его.
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    return null;
  }

  try {
    console.log('Инициализация Firebase Admin SDK из переменных окружения...');
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: `${serviceAccount.projectId}.appspot.com`,
    });
    console.log('Firebase Admin SDK успешно инициализирован.');
    return adminApp;
  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА: Не удалось инициализировать Firebase Admin SDK:', error instanceof Error ? error.message : error);
    return null;
  }
};

// Экспортируемые функции для получения доступа к сервисам.
export const getAdminDb = (): Firestore | null => {
  const app = ensureFirebaseAdminInitialized();
  return app ? getFirestore(app) : null;
};

export const getAdminStorage = (): Storage | null => {
  const app = ensureFirebaseAdminInitialized();
  return app ? getStorage(app) : null;
};
