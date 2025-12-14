
import type { NextApiRequest, NextApiResponse } from 'next';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

type ResponseData = {
  original: string | null;
  redesigned: string | null;
  error?: string;
  isFallback?: boolean;
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

async function runWithRetry(fn: () => Promise<any>, retries = 1, delay = 2000) {
    try {
        return await fn();
    } catch (error: any) {
        console.error("Replicate attempt failed:", error.message);
        const isRateLimit = error.response?.status === 429 || error.status === 429;
        
        if (retries > 0 && isRateLimit) {
            console.log(`Rate limit. Retrying in ${delay/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return runWithRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}

async function pollinationsFallback(prompt: string): Promise<string> {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pollinations failed: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData> 
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { imageUrl, prompt, style, isComposite } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ original: null, redesigned: null, error: 'Image URL is required' });
  }

  try {
    let output;
    let redesignedImageUrl: string | null = null;

    // Используем FLUX.1 [dev] - Лучшая модель для реализма
    // "black-forest-labs/flux-dev"
    const model = "black-forest-labs/flux-dev";
    
    // Промпт для Flux
    let finalPrompt = "";
    
    if (isComposite) {
        // Режим примерки: Важно описать реализм, но не менять суть
        finalPrompt = `A hyper-realistic photo of a modern interior. Soft natural lighting, realistic shadows, high quality, 4k, interior design magazine style. ${prompt || ''}`;
    } else {
        // Режим редизайна
        finalPrompt = `A photo of a room interior in ${style} style. ${prompt || ''}. High quality, photorealistic, architectural digest, 8k.`;
    }

    const input: any = {
        prompt: finalPrompt,
        image: imageUrl, // Передаем коллаж
        go_fast: true,
        guidance: 3.5,   
        megapixels: "1",
        num_inference_steps: 28,
        output_format: "jpg",
        output_quality: 95,
    };

    // --- НАСТРОЙКА СИЛЫ ИЗМЕНЕНИЙ (Критически важно!) ---
    if (isComposite) {
        // 0.45 - Идеальный баланс.
        // Сохраняет диван "как есть", но "притирает" его к комнате светом и тенями.
        input.prompt_strength = 0.45; 
        console.log("Mode: Flux Furniture Try-On (Collage Refinement)");
    } else {
        // Для полного редизайна
        input.prompt_strength = 0.85;
        console.log("Mode: Flux Room Redesign");
    }

    output = await runWithRetry(() => replicate.run(model, { input }));

    const resultItem = Array.isArray(output) ? output[0] : output;
    
    if (typeof resultItem === 'string') {
        // Возвращаем base64, чтобы фронт не зависел от доменов/CORS/next-image.
        redesignedImageUrl = await fetchAsDataUrl(resultItem);
    } else if (resultItem && typeof resultItem === 'object') {
        const arrayBuffer = await new Response(resultItem as any).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        redesignedImageUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }

    if (!redesignedImageUrl) throw new Error("Empty response from AI model");

    res.status(200).json({ 
        original: imageUrl, 
        redesigned: redesignedImageUrl 
    });

  } catch (replicateError: any) {
    console.error('Replicate failed:', replicateError);
    
    // Fallback ТОЛЬКО для обычного редизайна.
    // Для примерки мебели Fallback вреден, так как он генерирует другую комнату.
    if (!isComposite) {
        try {
            console.log("Attempting Fallback...");
            const fallbackPrompt = `Interior photo, ${style} style, ${prompt || ''}, 8k photorealistic`;
            const fallbackImage = await pollinationsFallback(fallbackPrompt);
            
            res.status(200).json({ 
                original: imageUrl, 
                redesigned: fallbackImage,
                isFallback: true 
            });
            return;
        } catch (e) {
            console.error("Fallback failed too");
        }
    }

    const userMessage = "Не удалось обработать изображение. Попробуйте еще раз.";
    res.status(500).json({ original: null, redesigned: null, error: userMessage });
  }
}
