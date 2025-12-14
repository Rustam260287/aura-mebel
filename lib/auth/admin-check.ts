
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth } from '../firebaseAdmin';

const ADMIN_EMAILS = ['amin8914@gmail.com', 'admin@labelcom.store'];

/**
 * Тихая проверка прав админа (без отправки ответа).
 * Возвращает true, если пользователь - админ.
 */
export async function checkIsAdmin(req: NextApiRequest): Promise<boolean> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAdminAuth();
    
    if (!auth) return false;

    const decodedToken = await auth.verifyIdToken(token);
    
    if (decodedToken.admin === true) return true;
    if (decodedToken.email && ADMIN_EMAILS.includes(decodedToken.email)) return true;

    return false;

  } catch (error) {
    return false;
  }
}

/**
 * Строгая проверка прав (middleware).
 * Если не админ — отправляет 403 и возвращает false.
 */
export async function verifyAdmin(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  const isAdmin = await checkIsAdmin(req);
  
  if (!isAdmin) {
      res.status(403).json({ error: 'Forbidden: Access denied' });
      return false;
  }
  
  return true;
}
