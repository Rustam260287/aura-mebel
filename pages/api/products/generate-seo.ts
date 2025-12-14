
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const prompt = `Напиши привлекательное и оптимизированное для поисковых систем (SEO) описание (meta description) для товара.
Название: "${name}".
Категория: "${category || ''}".
Описание: "${description || ''}".

Сделай описание длиной от 140 до 160 символов. Используй ключевые слова, призывай к действию, но звучи естественно. Описание должно быть на русском языке. Верни только готовый текст без кавычек.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 120,
    });

    const generatedText = completion.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No text generated');
    }

    const cleanText = generatedText.trim().replace(/^["']|["']$/g, '');

    res.status(200).json({ seoDescription: cleanText });
  } catch (error) {
    console.error('Error generating SEO:', error);
    res.status(500).json({ message: 'Failed to generate SEO description' });
  }
}
