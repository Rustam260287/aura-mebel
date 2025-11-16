
// lib/firebaseAdmin.ts
import admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { Storage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

// Эта функция будет нашим единственным способом получить доступ к admin SDK
const ensureFirebaseAdminInitialized = () => {
  if (admin.apps.length > 0) {
    return admin;
  }

  try {
    console.log('Lazy initializing Firebase Admin SDK from service account file...');
    
    const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
        // Не выводим критическую ошибку, если файл просто отсутствует
        console.warn('serviceAccountKey.json not found. Firebase Admin SDK not initialized.');
        return null;
    }
      
    const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountString);

    // --- ОКОНЧАТЕЛЬНОЕ ИСПРАВЛЕНИЕ ---
    // Программно заменяем строковые '\n' на реальные символы новой строки
    const formattedPrivateKey = serviceAccount.private_key.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        ...serviceAccount,
        private_key: formattedPrivateKey, // Используем исправленный ключ
      }),
      storageBucket: `${serviceAccount.project_id}.appspot.com`,
    });

    console.log('Lazy initialization of Firebase Admin SDK successful.');
  } catch (error) {
    if (error instanceof Error) {
      console.error('CRITICAL: Lazy initialization of Firebase Admin SDK failed:', error.message);
    } else {
      console.error('CRITICAL: Lazy initialization of Firebase Admin SDK failed with an unknown error.');
    }
    return null;
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
