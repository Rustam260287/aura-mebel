
import type { NextApiRequest, NextApiResponse } from 'next';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

type ResponseData = {
  original: string | null;
  redesigned: string | null;
  error?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { imageUrl, prompt, style } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // ЧЕТВЕРТАЯ ПОПЫТКА: Используем фундаментальную модель instruct-pix2pix от самого Replicate.
    const model = "replicate/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b981b4620b";
    
    // Эта модель использует общий параметр 'prompt' для инструкций.
    const instruction = `Redesign this room in a ${style} style${prompt ? `, ${prompt}` : ''}`;
    
    const input = {
      image: imageUrl,
      prompt: instruction,
    };

    let prediction = await replicate.predictions.create({
      model: model,
      input: input,
    });
    
    // Этой модели может потребоваться больше времени, дадим ей до 2-3 секунд между проверками.
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      await sleep(2500);
      prediction = await replicate.predictions.get(prediction.id);
    }

    if (prediction.status === 'failed') {
      const errorMessage = prediction.error?.detail || 'Failed to redesign image.';
      console.error('Replicate prediction failed:', prediction.error);
      return res.status(500).json({ error: errorMessage });
    }
    
    const redesignedImageUrl = Array.isArray(prediction.output) ? prediction.output.pop() : prediction.output;

    res.status(200).json({ 
        original: imageUrl, 
        redesigned: redesignedImageUrl 
    });

  } catch (error: any) {
    const errorMessage = error.message || 'An unexpected error occurred.';
    console.error('Error calling Replicate API:', error);
    res.status(500).json({ error: errorMessage });
  }
}
