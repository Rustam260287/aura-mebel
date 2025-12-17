
import Replicate from 'replicate';
import { NextApiRequest, NextApiResponse } from 'next';
import { MediaService } from '../../../lib/media/service';
import { checkRateLimit } from '../../../lib/rate-limit';
import { checkIsAdmin } from '../../../lib/auth/admin-check';

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
    try {
        return await MediaService.uploadFromUrl(url, 'ai-designs');
    } catch (e) {
        return url;
    }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData> 
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  // --- SECURITY: Rate Limiting ---
  const isAdmin = await checkIsAdmin(req);
  
  if (!isAdmin) {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
      const limitResult = await checkRateLimit(ip, 10, 3600000, 'ai_redesign');

      if (!limitResult.success) {
          return res.status(429).json({ 
              original: null, 
              redesigned: null, 
              error: 'Превышен лимит генераций. Попробуйте позже.' 
          });
      }
  }
  // -------------------------------

  const { imageUrl, prompt, style, isComposite } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ original: null, redesigned: null, error: 'Image URL is required' });
  }

  try {
    let output;
    let redesignedImageUrl: string | null = null;

    const model = "black-forest-labs/flux-dev";
    
    let finalPrompt = "";
    if (isComposite) {
        finalPrompt = `A hyper-realistic photo of a modern interior. Soft natural lighting, realistic shadows, high quality, 4k, interior design magazine style. ${prompt || ''}`;
    } else {
        finalPrompt = `A photo of a room interior in ${style} style. ${prompt || ''}. High quality, photorealistic, architectural digest, 8k.`;
    }

    const input: any = {
        prompt: finalPrompt,
        image: imageUrl, 
        go_fast: true,
        guidance: 3.5,   
        megapixels: "1",
        num_inference_steps: 28,
        output_format: "jpg",
        output_quality: 95,
    };

    if (isComposite) {
        input.prompt_strength = 0.15; 
        console.log("Mode: Flux Furniture Try-On (Collage Refinement)");
    } else {
        input.prompt_strength = 0.65;
        console.log("Mode: Flux Room Redesign");
    }

    console.log("Replicate API Input Payload:", JSON.stringify(input, null, 2));
    output = await runWithRetry(() => replicate.run(model, { input }));
    console.log("Replicate API Output:", JSON.stringify(output, null, 2));

    const replicationOutputUrl = Array.isArray(output) ? output[0] : output;
    
    if (typeof replicationOutputUrl === 'string' && replicationOutputUrl.startsWith('http')) {
        console.log("Uploading result to Firebase Storage...");
        redesignedImageUrl = await MediaService.uploadFromUrl(replicationOutputUrl, 'ai-designs');
        console.log("Saved to:", redesignedImageUrl);
    } else {
        throw new Error("Invalid response from AI model");
    }

    if (!redesignedImageUrl) throw new Error("Failed to process image");

    res.status(200).json({ 
        original: imageUrl, 
        redesigned: redesignedImageUrl 
    });

  } catch (replicateError: any) {
    console.error('Replicate failed:', replicateError);
    
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
