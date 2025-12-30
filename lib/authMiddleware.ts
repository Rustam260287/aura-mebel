import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';

// Убедимся, что Admin SDK инициализирован (хотя он должен быть инициализирован в lib/firebaseAdmin.ts,
// но authMiddleware может импортироваться отдельно).
// Лучше полагаться на то, что lib/firebaseAdmin уже вызван, 
// но для надежности импортируем ensureFirebaseAdminInitialized косвенно через getApps
import { getAdminDb } from './firebaseAdmin';
import { isAdminEmail, isAdminToken } from './auth/admin-emails';

export const verifyIdToken = async (token: string) => {
  // Вызов getAdminDb гарантирует инициализацию приложения
  getAdminDb(); 

  // Используем getAuth() без аргументов, чтобы взять default app
  // Если default app не инициализирован, getAdminDb это сделал
  const auth = getAuth(); 

  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    throw new Error('Unauthorized');
  }
};

export const isAdmin = (value: unknown) => {
  if (typeof value === 'string') return isAdminEmail(value);
  return isAdminToken(value);
};
