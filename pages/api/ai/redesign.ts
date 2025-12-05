
import type { NextApiRequest, NextApiResponse } from 'next';
import Replicate from 'replicate';

const MOCK_MODE = false; 

type ResponseData = {
  original: string | null;
  redesigned: string | null;
  error?: string;
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

async function runWithRetry(fn: () => Promise<any>, retries = 1, delay = 10000) {
    try {
        return await fn();
    } catch (error: any) {
        const isRateLimit = error.response?.status === 429 || error.status === 429 || (error.message && error.message.includes('429'));
        
        if (retries > 0 && isRateLimit) {
            console.log(`Replicate Rate limit hit (429). Retrying in ${delay/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return runWithRetry(fn, retries - 1, delay);
        }
        throw error;
    }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData> // Убеждаемся, что тип здесь
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  try {
    const { imageUrl, prompt, style } = req.body;

    if (!imageUrl) {
      // ИСПРАВЛЕНО: Добавляем null значения для соответствия типу
      return res.status(400).json({ original: null, redesigned: null, error: 'Image URL is required' });
    }

    let output;
    let usedModel = 'Adirik/Interior';

    try {
        console.log("Attempting Adirik Interior Design model...");
        const model = "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38";
        
        const input = {
            image: imageUrl,
            prompt: `Interior design of a room, ${style} style, ${prompt || ''}, keep ceiling shape, preserve architecture, new furniture, photorealistic, 8k, interior magazine`,
            negative_prompt: "distorted ceiling, distorted walls, changing room layout, lowres, bad anatomy, worst quality, low quality, watermark",
            guidance_scale: 7.5,
            condition_scale: 0.8,
            num_inference_steps: 30
        };
        
        output = await runWithRetry(() => replicate.run(model, { input }));
        
        if (Array.isArray(output) && output.length > 1) output = output[1];
        else if (Array.isArray(output)) output = output[0];

    } catch (primaryError: any) {
        const isRateLimit = primaryError.response?.status === 429 || primaryError.status === 429;
        if (isRateLimit) throw primaryError;

        console.warn("Adirik model failed, falling back to SDXL (Conservative Mode).", primaryError.message);
        usedModel = 'SDXL-Safe';
        
        const sdxlModel = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
        
        const sdxlInput = {
            image: imageUrl,
            prompt: `Interior design of a room, ${style} style, ${prompt || ''}, preserve ceiling shape, keep walls and windows exact, new furniture, high quality, photorealistic`,
            negative_prompt: "distorted ceiling, distorted walls, changing room layout, lowres, worst quality",
            prompt_strength: 0.55, 
            num_inference_steps: 40,
            guidance_scale: 7.5,
            refine: "expert_ensemble_refiner",
        };
        
        output = await runWithRetry(() => replicate.run(sdxlModel, { input: sdxlInput }));
        if (Array.isArray(output)) output = output[0];
    }

    console.log(`Replicate run finished (${usedModel}).`);

    if (!output) throw new Error("Replicate returned empty output");

    let redesignedImageUrl: string;
    const resultItem = Array.isArray(output) ? output[0] : output;

    if (typeof resultItem === 'string') {
        redesignedImageUrl = resultItem;
    } else if (resultItem && typeof resultItem === 'object') {
        const arrayBuffer = await new Response(resultItem).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        redesignedImageUrl = `data:image/png;base64,${base64}`;
    } else {
        throw new Error("Unknown output format");
    }

    res.status(200).json({ 
        original: imageUrl, 
        redesigned: redesignedImageUrl
    });

  } catch (error: any) {
    const errorMessage = error.message || 'Error';
    console.error('API Error:', error);
    const status = error.response?.status || error.status || 500;
    // ИСПРАВЛЕНО: Добавляем null значения и здесь
    res.status(status).json({ original: null, redesigned: null, error: errorMessage });
  }
}
