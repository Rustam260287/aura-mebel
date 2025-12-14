
import { NextApiRequest, NextApiResponse } from 'next';
import { generateSeoDescription } from '../../../services/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, category, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Product name is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set; cannot generate SEO');
    return res.status(500).json({ message: 'SEO service is not configured (missing OPENAI_API_KEY)' });
  }

  try {
    const seoDescription = await generateSeoDescription({ name, category, description });
    res.status(200).json({ seoDescription });
  } catch (error) {
    console.error('Error generating SEO:', error);
    res.status(500).json({ message: 'Failed to generate SEO description' });
  }
}
