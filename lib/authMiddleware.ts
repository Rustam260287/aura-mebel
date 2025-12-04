import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';

// Убедимся, что Admin SDK инициализирован (хотя он должен быть инициализирован в lib/firebaseAdmin.ts,
// но authMiddleware может импортироваться отдельно).
// Лучше полагаться на то, что lib/firebaseAdmin уже вызван, 
// но для надежности импортируем ensureFirebaseAdminInitialized косвенно через getApps
import { getAdminDb } from './firebaseAdmin';

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

// Список email-адресов администраторов. 
// В продакшене это должно быть в переменных окружения process.env.ADMIN_EMAILS
const DEFAULT_ADMIN_EMAILS = ['admin@example.com', 'test@example.com']; 
// TODO: Замените на реальные email или настройте process.env.ADMIN_EMAILS

export const isAdmin = (email: string | undefined) => {
  if (!email) return false;
  const adminList = (process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim()).filter(Boolean)
    : DEFAULT_ADMIN_EMAILS
  );
  return adminList.includes(email);
};
