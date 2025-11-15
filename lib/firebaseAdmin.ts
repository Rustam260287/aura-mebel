
// lib/firebaseAdmin.ts
import admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { Storage } from 'firebase-admin/storage';

// Эта функция будет нашим единственным способом получить доступ к admin SDK
const ensureFirebaseAdminInitialized = () => {
  if (!admin.apps.length) {
    try {
      console.log('Lazy initializing Firebase Admin SDK...');
      const serviceAccount = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      };

      if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        throw new Error('Firebase Admin SDK credentials are not set in .env.local');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
       console.log('Lazy initialization of Firebase Admin SDK successful.');
    } catch (error) {
      if (error instanceof Error) {
        console.error('CRITICAL: Lazy initialization of Firebase Admin SDK failed:', error.message);
      } else {
        console.error('CRITICAL: Lazy initialization of Firebase Admin SDK failed with an unknown error.');
      }
      // Если инициализация не удалась, мы не можем продолжить.
      // Возвращаем null или выбрасываем ошибку, чтобы вызывающий код мог это обработать.
      return null;
    }
  }
  return admin;
};

// Функции-геттеры, которые будут использоваться в getServerSideProps
export const getAdminDb = (): Firestore | null => {
  const adminInstance = ensureFirebaseAdminInitialized();
  return adminInstance ? adminInstance.firestore() : null;
};

export const getAdminStorage = (): Storage | null => {
  const adminInstance = ensureFirebaseAdminInitialized();
  return adminInstance ? adminInstance.storage() : null;
};
