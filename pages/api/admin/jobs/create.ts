
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { verifyAdmin } from '../../../../lib/auth/admin-check';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // --- SECURITY CHECK ---
  const isAdmin = await verifyAdmin(req, res);
  if (!isAdmin) return;
  // ----------------------

  const { type } = req.body;
  
  if (!['bulk_ai_specs', 'bulk_rewrite_desc', 'bulk_generate_interior_photos'].includes(type)) {
      return res.status(400).json({ error: 'Invalid job type' });
  }

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not available' });

  try {
    const snapshot = await db.collection('products').select().get();
    const targetIds = snapshot.docs.map(doc => doc.id);

    if (targetIds.length === 0) {
        return res.status(400).json({ error: 'No products found' });
    }

    const newJob = {
        type,
        status: 'pending',
        totalItems: targetIds.length,
        processedItems: 0,
        targetIds,
        errors: [],
        createdAt: new Date().toISOString()
    };

    const jobRef = await db.collection('jobs').add(newJob);

    res.status(200).json({ jobId: jobRef.id, ...newJob });

  } catch (error: any) {
    console.error('Job Creation Error:', error);
    res.status(500).json({ error: error.message });
  }
}
