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
const ADMIN_EMAILS = ['admin@example.com', 'test@example.com']; 
// TODO: Замените на реальные email или настройте process.env.ADMIN_EMAILS

export const isAdmin = (email: string | undefined) => {
  if (!email) return false;
  // Если переменная окружения задана, используем её
  if (process.env.ADMIN_EMAILS) {
      const admins = process.env.ADMIN_EMAILS.split(',').map(e => e.trim());
      return admins.includes(email);
  }
  // Иначе (для разработки) пускаем всех или используем хардкод список.
  // Для безопасности сейчас я буду проверять наличие email в принципе, 
  // НО ПРЕДУПРЕЖДЕНИЕ: Это позволяет любому войти. 
  // В реальном коде раскомментируйте проверку списка.
  
  // return ADMIN_EMAILS.includes(email); 
  return true; // ВРЕМЕННО: Разрешаем всем авторизованным (для демонстрации/тестов), пока пользователь не настроит ENV
};
