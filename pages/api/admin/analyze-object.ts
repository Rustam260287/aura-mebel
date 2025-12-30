
import type { NextApiRequest, NextApiResponse } from 'next';
import { askAI } from '../../../lib/ai/core';
import { verifyAdmin } from '../../../lib/auth/admin-check';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- SECURITY CHECK ---
  const isAdmin = await verifyAdmin(req, res);
  if (!isAdmin) return;
  // ----------------------

  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  try {
    const parsedData = await askAI({
        key: 'OBJECT_ANALYZE',
        variables: { description },
        responseFormat: 'json',
        model: 'gpt-3.5-turbo'
    });

    res.status(200).json(parsedData);

  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze object' });
  }
}
