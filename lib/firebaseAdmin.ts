
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// --- ИСПРАВЛЕНО: Используем правильное имя бакета ---
const BUCKET_NAME = 'aura-mebel-7ec96.firebasestorage.app';
let initSourceLogged = false;

const logInitSource = (message: string, level: 'log' | 'warn' = 'log') => {
  if (initSourceLogged) return;
  initSourceLogged = true;
  console[level](message);
};

const tryParseServiceAccount = (raw: string): admin.ServiceAccount | undefined => {
  const normalized = raw.replace(/\\n/g, '\n').trim();

  try {
    return JSON.parse(normalized) as admin.ServiceAccount;
  } catch {
    const repaired = normalized.replace(
      /"private_key":"([\s\S]*?)","client_email":/,
      (_match, privateKey: string) =>
        `"private_key":"${privateKey.replace(/\r?\n/g, '\\n')}","client_email":`,
    );

    try {
      return JSON.parse(repaired) as admin.ServiceAccount;
    } catch {
      return undefined;
    }
  }
};

export const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  let serviceAccount: admin.ServiceAccount | undefined;

  // 1. Сначала пробуем получить ключ из переменной окружения
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    logInitSource("Firebase Admin SDK: initialization via FIREBASE_SERVICE_ACCOUNT");
    serviceAccount = tryParseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!serviceAccount) {
      console.error("Критическая ошибка: не удалось распарсить FIREBASE_SERVICE_ACCOUNT.");
    }
  }

  if (!serviceAccount) {
    logInitSource("Firebase Admin SDK: initialization via serviceAccountKey.json / ADC");
    try {
      const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(serviceAccountFile) as admin.ServiceAccount;
      } else {
        // Cloud Build / Cloud Run / Cloud Functions may rely on ADC.
        logInitSource(`Firebase Admin SDK: serviceAccountKey.json not found, falling back to ADC`, 'warn');
        return admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          storageBucket: BUCKET_NAME,
        });
      }
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

export const db = getAdminDb();
