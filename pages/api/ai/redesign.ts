
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Limit for base64 image
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { imageBase64, style } = req.body;

    if (!imageBase64 || !style) {
      return res.status(400).json({ message: 'Image and style are required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'OpenAI API key not configured' });
    }

    const openai = new OpenAI({ apiKey });

    // 1. Analyze the room layout using GPT-4o (Vision)
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this room's layout, window positions, and main furniture placement in detail. Keep it concise but descriptive enough to recreate the scene." },
            {
              type: "image_url",
              image_url: {
                "url": imageBase64,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const description = visionResponse.choices?.[0]?.message?.content;
    
    if (!description) {
        throw new Error("Не удалось проанализировать изображение комнаты.");
    }

    console.log("Room Description:", description);

    // 2. Generate new room design using DALL-E 3
    const imagePrompt = `A photorealistic interior design of a room: ${description}. 
    Redesigned in ${style} style. 
    Professional interior photography, 4k, cozy atmosphere, high quality furniture.`;

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      response_format: "url", // We can return URL directly to client
      quality: "standard",
      style: "natural"
    });

    const newImageUrl = imageResponse.data?.[0]?.url;

    if (!newImageUrl) {
        throw new Error("Не удалось сгенерировать новое изображение.");
    }

    res.status(200).json({ 
      originalDescription: description,
      generatedImage: newImageUrl 
    });

  } catch (error: any) {
    console.error("AI Redesign Error:", error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
