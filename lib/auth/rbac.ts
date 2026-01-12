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
        const isLegacy = isAdminToken(decodedToken);
        console.log(`[RBAC] User: ${decodedToken.email} (${decodedToken.uid}) | LegacyAdmin: ${isLegacy}`);

        // Если это "старый" админ из .env, считаем его Владельцем
        if (isLegacy) {
            return 'owner';
        }

        // 2. Firestore RBAC Check
        // Если не в .env, проверяем базу команды
        const uid = decodedToken.uid;
        const db = getAdminDb();
        const userDoc = await db.collection('team_users').doc(uid).get();

        if (userDoc.exists) {
            const data = userDoc.data();
            const role = (data?.role as TeamRole) || null;
            console.log(`[RBAC] Firestore Role for ${uid}: ${role}`);
            return role;
        }

        console.log(`[RBAC] No role found for ${uid}`);
        return null;

    } catch (error) {
        console.error('RBAC getUserRole error:', error);
        return null;
    }
}

// Helper to log why access failed
function logAccessRefusal(details: string, debugData?: any) {
    console.warn(`[RBAC] Access Refused: ${details}`, debugData ? JSON.stringify(debugData, null, 2) : '');
}

/**
 * Middleware для защиты API по ролям.
 * Если у пользователя нет одной из разрешенных ролей, отправляет 403.
 */
export async function verifyRole(req: NextApiRequest, res: NextApiResponse, allowedRoles: TeamRole[]): Promise<boolean> {
    const role = await getUserRole(req);

    if (!role || !allowedRoles.includes(role)) {
        res.status(403).json({
            error: 'Доступ запрещен: Недостаточно прав',
            foundRole: role || 'guest',
            required: allowedRoles
        });
        return false;
    }

    return true;
}
