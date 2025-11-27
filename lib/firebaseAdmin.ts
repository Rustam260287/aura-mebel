
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Проверяем, было ли приложение уже инициализировано
if (!admin.apps.length) {
  console.log('Firebase Admin SDK не был инициализирован. Попытка инициализации...');
  
  const serviceAccountPath = path.resolve('./service-account-key.json');

  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
      });
      console.log('Firebase Admin SDK успешно инициализирован.');

    } catch (error) {
      console.error('Ошибка при инициализации Firebase Admin SDK:', error);
    }
  } else {
    console.warn('Файл service-account-key.json не найден. Admin SDK не инициализирован.');
  }
}

// Экспортируем функции, которые будут возвращать сервисы (или null, если инициализация не удалась)
const getAdminDb = () => {
  if (!admin.apps.length) {
    return null;
  }
  return admin.firestore();
};

const getAdminStorage = () => {
  if (!admin.apps.length) {
    return null;
  }
  return admin.storage();
};

export { getAdminDb, getAdminStorage };
