import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminAuth, getAdminDb } from '../firebaseAdmin';
import { isAdminToken } from './admin-emails';
import { TeamRole } from '../../types/curator';

/**
 * Определяет роль текущего пользователя.
 * 1. Проверяет Legacy Admin (Env Vars) -> 'owner'
 * 2. Проверяет коллекцию team_users в Firestore -> role из БД
 */
export async function getUserRole(req: NextApiRequest): Promise<TeamRole | null> {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.split('Bearer ')[1];
        const auth = getAdminAuth();
        if (!auth) return null;

        const decodedToken = await auth.verifyIdToken(token);

        // 1. Legacy Admin Check (Env Vars)
        // Если это "старый" админ из .env, считаем его Владельцем
        if (isAdminToken(decodedToken)) {
            return 'owner';
        }

        // 2. Firestore RBAC Check
        // Если не в .env, проверяем базу команды
        const uid = decodedToken.uid;
        const db = getAdminDb();
        const userDoc = await db.collection('team_users').doc(uid).get();

        if (userDoc.exists) {
            const data = userDoc.data();
            return (data?.role as TeamRole) || null;
        }

        return null;

    } catch (error) {
        console.error('RBAC getUserRole error:', error);
        return null;
    }
}

/**
 * Middleware для защиты API по ролям.
 * Если у пользователя нет одной из разрешенных ролей, отправляет 403.
 */
export async function verifyRole(req: NextApiRequest, res: NextApiResponse, allowedRoles: TeamRole[]): Promise<boolean> {
    const role = await getUserRole(req);

    if (!role || !allowedRoles.includes(role)) {
        res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        return false;
    }

    return true;
}
