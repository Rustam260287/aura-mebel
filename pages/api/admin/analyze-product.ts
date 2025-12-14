
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  try {
    const prompt = `
      Analyze the following product description and extract key specifications into a JSON format.
      Target fields: "width" (in cm), "depth" (in cm), "height" (in cm), "material" (main material), "color", "sleeping_area" (if applicable).
      If a value is not found, leave it as null or an empty string.
      
      Description:
      "${description}"
      
      Return ONLY valid JSON.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview", // Or gpt-3.5-turbo
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0].message.content;
    if (!result) throw new Error('No content returned from AI');

    const parsedData = JSON.parse(result);
    res.status(200).json(parsedData);

  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze product' });
  }
}
