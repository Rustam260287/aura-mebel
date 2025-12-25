
import OpenAI from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { MediaService } from '../../../lib/media/service';
import { checkRateLimit } from '../../../lib/rate-limit';
import { checkIsAdmin } from '../../../lib/auth/admin-check';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.warn("⚠️ OPENAI_API_KEY is missing. AI features will not work.");
}
const openai = new OpenAI({ apiKey });

type ResponseData = {
  original: string | null;
  redesigned: string | null;
  error?: string;
  imageUrl?: string | null;
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },
};

const SYSTEM_PROMPT = `
You are an expert AI interior architect. Your task is to write a prompt for an img2img model to subtly redesign furniture while being OBSESSIVE about preserving the room's architecture.

**STRICT PRESERVATION RULES:**
1.  **WALLS & WINDOWS:** Do not move, add, or change walls, windows, or doors. Keep their exact positions.
2.  **PERSPECTIVE:** Keep the exact camera angle and perspective of the original room.
3.  **FURNITURE SWAP:** Only describe the replacement of furniture pieces (sofa, tables, etc.) in the new style.
4.  **TONE:** "A photorealistic photo of the exact same room, but with new furniture in [STYLE] style. High-end, calm, premium."

**OUTPUT:** ONLY the concise prompt text.
`;

async function analyzeAndCreatePrompt(imageUrl: string, targetStyle: string, userWish?: string): Promise<string> {
    if (!apiKey) return `A photorealistic room in ${targetStyle} style`;

    try {
        console.log("GPT-4o Vision: Analyzing for high-fidelity redesign...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: [
                        { type: "text", text: `Analyze this room. Write a prompt to replace the current furniture with a "${targetStyle}" style collection. ${userWish ? `User wish: ${userWish}`: ''}. Keep the walls, floor and windows exactly as they are in the photo.` },
                        { type: "image_url", image_url: { "url": imageUrl } },
                    ],
                },
            ],
            max_tokens: 250,
        });
        
        const generatedPrompt = response.choices[0].message.content;
        return generatedPrompt || `A photorealistic room in ${targetStyle} style`;
    } catch (error) {
        console.error("GPT Vision failed:", error);
        return `A high-end interior design photo of a room in ${targetStyle} style. Photorealistic, 8k.`;
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

  try {
      const isAdmin = await checkIsAdmin(req);
      if (!isAdmin) {
          const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
          const limitResult = await checkRateLimit(ip, 20, 3600000, 'ai_redesign');
          if (!limitResult.success) {
              return res.status(429).json({ original: null, redesigned: null, error: 'Лимит превышен.' });
          }
      }
  } catch (e) {
      console.warn("Rate limit check failed", e);
  }

  const { image, imageUrl, prompt: userWish, style = 'Modern and Calm' } = req.body;
  const inputImage = image || imageUrl;

  if (!inputImage) {
    return res.status(400).json({ original: null, redesigned: null, error: 'Image required' });
  }

  try {
    let publicImageUrl = inputImage;

    if (!inputImage.startsWith('http')) {
        console.log("Uploading input...");
        let base64Data = inputImage.startsWith('data:') ? inputImage.split(',')[1] : inputImage;
        const buffer = Buffer.from(base64Data, 'base64');
        publicImageUrl = await MediaService.uploadBuffer(buffer, 'ai-inputs', 'image/jpeg');
    }

    const finalPrompt = await analyzeAndCreatePrompt(publicImageUrl, style, userWish);
    console.log("Final Prompt for Flux:", finalPrompt);

    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(finalPrompt);
    const encodedImage = encodeURIComponent(publicImageUrl);
    
    // Setting strength to 0.2 for maximum structure preservation
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}&image=${encodedImage}&enhance=false&strength=0.2`;
    
    console.log("Generating with Flux (Strength 0.2)...");

    const redesignedImageUrl = await MediaService.uploadFromUrl(pollinationsUrl, 'ai-designs');
    if (!redesignedImageUrl) throw new Error("Image generation failed.");

    res.status(200).json({ 
        original: publicImageUrl, 
        redesigned: redesignedImageUrl,
        imageUrl: redesignedImageUrl 
    });

  } catch (error: any) {
    console.error('AI Redesign pipeline failed:', error);
    res.status(500).json({ 
        original: null, 
        redesigned: null, 
        error: error.message || "Ошибка генерации изображения" 
    });
  }
}
