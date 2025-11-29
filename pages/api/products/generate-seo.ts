
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, category, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Product name is required' });
  }

  try {
    const prompt = `Напиши привлекательное и оптимизированное для поисковых систем (SEO) описание (meta description) для товара. 
    Название: "${name}". 
    Категория: "${category}". 
    Описание: "${description || ''}".
    
    Сделай описание длиной от 140 до 160 символов. Используй ключевые слова, призывай к действию, но звучи естественно. Описание должно быть на русском языке.`;

    const API_URL = `${process.env.ARTEMOX_BASE_URL}/models/gemini-1.5-flash:generateContent`;
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ARTEMOX_API_KEY}`,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      throw new Error('Failed to generate SEO description');
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No text generated');
    }

    // Очищаем текст от лишних кавычек или пробелов
    const cleanText = generatedText.trim().replace(/^["']|["']$/g, '');

    res.status(200).json({ seoDescription: cleanText });
  } catch (error) {
    console.error('Error generating SEO:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
