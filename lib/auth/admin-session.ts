import type { NextApiRequest, NextApiResponse } from 'next';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminAuth } from '../firebaseAdmin';
import { isAdminToken } from './admin-emails';
import { getAdminRole, type AdminRole } from './admin-role';

export type AdminSession = {
  token: DecodedIdToken;
  role: AdminRole;
  email?: string;
  uid: string;
};

function getBearerToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  return token ? token : null;
}

export async function requireAdminSession(req: NextApiRequest, res: NextApiResponse): Promise<AdminSession | null> {
  try {
    const tokenString = getBearerToken(req);
    if (!tokenString) {
      res.status(403).json({ error: 'Forbidden: Access denied' });
      return null;
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(tokenString);
    if (!isAdminToken(decoded)) {
      res.status(403).json({ error: 'Forbidden: Access denied' });
      return null;
    }

    return {
      token: decoded,
      role: getAdminRole(decoded),
      email: typeof decoded.email === 'string' ? decoded.email : undefined,
      uid: decoded.uid,
    };
  } catch (error) {
    res.status(403).json({ error: 'Forbidden: Access denied' });
    return null;
  }
}

export async function requireManagerSession(req: NextApiRequest, res: NextApiResponse): Promise<AdminSession | null> {
  const session = await requireAdminSession(req, res);
  if (!session) return null;
  if (session.role !== 'manager') {
    res.status(403).json({ error: 'Forbidden: Aggregated-only access' });
    return null;
  }
  return session;
}

export async function requireOwnerSession(req: NextApiRequest, res: NextApiResponse): Promise<AdminSession | null> {
  const session = await requireAdminSession(req, res);
  if (!session) return null;
  if (session.role !== 'owner') {
    res.status(403).json({ error: 'Forbidden: Owner-only access' });
    return null;
  }
  return session;
}
