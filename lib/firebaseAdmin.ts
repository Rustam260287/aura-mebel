
import admin from 'firebase-admin';

const BUCKET_NAME = 'aura-mebel-7ec96.appspot.com';

export const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    // --- ИСПРАВЛЕНО: Читаем конфигурацию из переменной окружения ---
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);

    console.log("Firebase Admin SDK инициализирован из переменной окружения.");
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: BUCKET_NAME,
    });
  } catch (error) {
    console.error('Критическая ошибка: Не удалось инициализировать Firebase Admin SDK.', error);
    // В случае ошибки на сервере, приложение не сможет работать, поэтому выбрасываем исключение
    throw new Error("Не удалось инициализировать Firebase Admin SDK.");
  }
};

export const getAdminDb = () => {
  if (admin.apps.length === 0) {
    initializeFirebaseAdmin();
  }
  return admin.firestore();
};
