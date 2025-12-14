
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth } from '../firebaseAdmin';

const ADMIN_EMAILS = ['amin8914@gmail.com', 'admin@labelcom.store'];

/**
 * Проверяет, является ли пользователь администратором.
 * Используется в API routes.
 * 
 * Если проверки не пройдены, отправляет ответ 401/403 и возвращает false.
 * Если все ок, возвращает true.
 */
export async function verifyAdmin(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return false;
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAdminAuth();
    
    if (!auth) {
        // Fallback for dev environment without admin SDK initialized properly
        console.error("Firebase Admin Auth not initialized");
        res.status(500).json({ error: 'Internal Server Error' });
        return false;
    }

    const decodedToken = await auth.verifyIdToken(token);
    
    // 1. Проверка через Custom Claims (рекомендуется)
    if (decodedToken.admin === true) {
        return true;
    }

    // 2. Проверка через Email (временный вариант)
    if (decodedToken.email && ADMIN_EMAILS.includes(decodedToken.email)) {
        return true;
    }

    console.warn(`Access denied for user: ${decodedToken.email} (${decodedToken.uid})`);
    res.status(403).json({ error: 'Forbidden: Access denied' });
    return false;

  } catch (error) {
    console.error('Auth verification failed:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return false;
  }
}
