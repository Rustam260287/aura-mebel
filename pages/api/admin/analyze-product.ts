
import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeProductDescription } from '../../../services/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set; cannot analyze product');
    return res.status(500).json({ error: 'AI service is not configured (missing OPENAI_API_KEY)' });
  }

  try {
    const parsedData = await analyzeProductDescription(description);
    res.status(200).json(parsedData);

  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze product' });
  }
}
