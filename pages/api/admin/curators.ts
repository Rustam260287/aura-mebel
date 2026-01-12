import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { CuratorProfile } from '../../../types/curator';
import { verifyRole } from '../../../lib/auth/rbac';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
}
}
