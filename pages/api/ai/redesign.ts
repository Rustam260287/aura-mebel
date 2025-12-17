
import OpenAI from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { MediaService } from '../../../lib/media/service';
import { checkRateLimit } from '../../../lib/rate-limit';
import { checkIsAdmin } from '../../../lib/auth/admin-check';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    responseLimit: false,
  },
};

// ЭТАП 1: GPT-4o Vision создает "Текстовый каркас"
async function analyzeStructureWithGPT(imageUrl: string, targetStyle: string): Promise<string> {
    try {
        console.log("GPT-4o Vision: Analyzing room geometry...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are an interior designer. Describe the room's layout, perspective, and key structural elements (windows, doors, ceiling beams) in detail. Ignore old furniture and mess. Then write a prompt for an image generator to create a STUNNING, HIGH-END renovation of this exact room in the requested style."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: `Analyze this room. Write a prompt to redesign it in ${targetStyle} style. Start with: "A high-end interior design photo of a ${targetStyle} room with..." Describe the new materials, lighting, and furniture placement (keeping the same layout).` },
                        {
                            type: "image_url",
                            image_url: {
                                "url": imageUrl,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 250,
        });
        
        const structure = response.choices[0].message.content;
        console.log("GPT Generated Prompt:", structure);
        return structure || `A photorealistic room in ${targetStyle} style`;
    } catch (error) {
        console.error("GPT Vision failed:", error);
        return `A photorealistic room in ${targetStyle} style, high quality, 8k`;
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

  const isAdmin = await checkIsAdmin(req);
  if (!isAdmin) {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
      const limitResult = await checkRateLimit(ip, 100, 3600000, 'ai_redesign');
      if (!limitResult.success) {
          return res.status(429).json({ original: null, redesigned: null, error: 'Превышен лимит генераций.' });
      }
  }

  const { imageUrl, prompt, style } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ original: null, redesigned: null, error: 'Image URL is required' });
  }

  try {
    let redesignedImageUrl: string | null = null;
    let publicImageUrl = imageUrl;

    // 1. Подготовка: Загружаем исходник в облако
    if (imageUrl.startsWith('data:image')) {
        console.log("Uploading input to Storage...");
        const matches = imageUrl.match(/^data:(.+);base64,(.+)$/);
        if (!matches) throw new Error("Invalid base64");
        
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        publicImageUrl = await MediaService.uploadBuffer(buffer, 'ai-inputs', mimeType);
    }

    // 2. Анализ: GPT-4o создает красивый дизайнерский промпт
    const gptPrompt = await analyzeStructureWithGPT(publicImageUrl, style);

    // 3. Синтез: Формируем финальный промпт
    const finalPrompt = `${gptPrompt} ${prompt || ''} Cinematic lighting, 8k, architectural digest photo.`;
    
    console.log("Final Prompt for Flux:", finalPrompt);

    // 4. Генерация: Pollinations (Flux)
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(finalPrompt);
    const encodedImage = encodeURIComponent(publicImageUrl);
    
    // model=flux
    // enhance=true (пусть Flux улучшает промпт для красоты)
    // strength=0.75 (Даем волю фантазии! Это сделает настоящий редизайн)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}&image=${encodedImage}&enhance=true&strength=0.75`;

    console.log("Generating URL:", pollinationsUrl);

    console.log("Saving result...");
    redesignedImageUrl = await MediaService.uploadFromUrl(pollinationsUrl, 'ai-designs');
    console.log("Saved:", redesignedImageUrl);

    if (!redesignedImageUrl) throw new Error("Failed to process image");

    res.status(200).json({ 
        original: imageUrl, 
        redesigned: redesignedImageUrl 
    });

  } catch (error: any) {
    console.error('Pipeline failed:', error);
    res.status(500).json({ original: null, redesigned: null, error: error.message || "Ошибка генерации" });
  }
}
