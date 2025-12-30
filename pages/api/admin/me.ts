import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../lib/auth/admin-session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireAdminSession(req, res);
  if (!session) return;

  return res.status(200).json({
    role: session.role,
    email: session.email || null,
  });
}

