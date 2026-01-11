import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../lib/firebaseAdmin';
import { DEFAULT_CONTACTS, ContactConfig } from '../../lib/config/contacts';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const db = getAdminDb();
        if (!db) {
            return res.status(200).json(DEFAULT_CONTACTS);
        }

        // Read from 'settings/handoff' (matching Admin logic)
        const doc = await db.collection('settings').doc('handoff').get();

        if (!doc.exists) {
            return res.status(200).json(DEFAULT_CONTACTS);
        }

        const data = doc.data();

        // Legacy support: map 'whatsapp' (link) to nothing if not digits, or use new 'whatsappNumber'
        // Actually AdminHandoff now saves 'whatsappNumber'.
        // If legacy 'whatsapp' holds a link, we ignore it or try to extract digits?
        // Let's rely on new fields primarily.

        const safeConfig: ContactConfig = {
            whatsappNumber: data?.whatsappNumber || '',
            telegramUsername: data?.telegramUsername || '',
            managerName: data?.managerName || DEFAULT_CONTACTS.managerName,
            managerRole: data?.managerRole || DEFAULT_CONTACTS.managerRole
        };

        return res.status(200).json(safeConfig);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
