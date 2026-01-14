import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { CuratorProfile } from '../../../types/curator';
import { verifyRole } from '../../../lib/auth/rbac';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = getAdminDb();
    const collection = db.collection('curators');

    try {
        if (req.method === 'GET') {
            // READ: Allow Owner, Admin, Editor
            const hasAccess = await verifyRole(req, res, ['owner', 'admin', 'editor']);
            if (!hasAccess) return;

            const snapshot = await collection.get();
            const curators = snapshot.docs.map(doc => doc.data() as CuratorProfile);
            return res.status(200).json(curators);
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            // WRITE (Create/Update): Allow Owner, Admin, Editor
            const hasAccess = await verifyRole(req, res, ['owner', 'admin', 'editor']);
            if (!hasAccess) return;

            const body = req.body as Partial<CuratorProfile>;

            // Validation
            if (!body.id || typeof body.id !== 'string') {
                return res.status(400).json({
                    error: 'ID куратора обязателен',
                    code: 'MISSING_ID'
                });
            }

            if (!body.displayName?.trim()) {
                return res.status(400).json({
                    error: 'Имя куратора обязательно',
                    code: 'MISSING_NAME'
                });
            }

            if (!body.roleLabel?.trim()) {
                return res.status(400).json({
                    error: 'Роль куратора обязательна',
                    code: 'MISSING_ROLE'
                });
            }

            // Normalize contacts
            const normalizedBody = {
                ...body,
                contacts: {
                    whatsapp: body.contacts?.whatsapp?.replace(/\D/g, '') || '',
                    telegram: body.contacts?.telegram?.replace(/^@/, '') || '',
                    phone: body.contacts?.phone || '',
                },
                updatedAt: new Date().toISOString(),
            };

            const docRef = collection.doc(body.id);
            await docRef.set(normalizedBody, { merge: true });
            return res.status(200).json({ success: true, id: body.id });
        }

        if (req.method === 'DELETE') {
            // DELETE: Allow only Owner, Admin (Safety)
            const hasAccess = await verifyRole(req, res, ['owner', 'admin']);
            if (!hasAccess) return;

            const { id } = req.query;
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Missing ID' });
            }

            await collection.doc(id).delete();
            return res.status(200).json({ success: true });
        }

        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (error) {
        console.error('Curators API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
