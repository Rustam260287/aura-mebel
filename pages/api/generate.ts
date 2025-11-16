
// pages/api/generate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Product } from '../../types';

// Function to safely extract JSON from a string
const extractJson = (text: string, step: string): any => {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    if (match && match[1]) {
        return JSON.parse(match[1]);
    }
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error(`Raw response at step ${step} that failed parsing:`, text);
        throw new Error(`Could not find or parse JSON in the AI response at step ${step}.`);
    }
};

// Function to get the AI instance
const getAiInstance = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set in .env.local");
  }
  return new GoogleGenerativeAI(apiKey);
};

async function handleRoomMakeover(req: NextApiRequest, res: NextApiResponse) {
    console.log("Handling room makeover request with a stable, two-step vision model process...");
    const { base64, mimeType, style, allProducts } = req.body;
    if (!base64 || !mimeType || !style || !allProducts) {
        return res.status(400).json({ error: 'Missing parameters for room makeover.' });
    }

    try {
        const ai = getAiInstance();
        
        // --- Этап 1 & 2: Используем ЕДИНСТВЕННУЮ рабочую модель для обеих задач ---
        const modelName = "gemini-pro-vision";
        console.log(`Using the only available and working model for both steps: ${modelName}`);
        const generativeModel = ai.getGenerativeModel({ model: modelName });
        
        const imagePart = { inlineData: { data: base64, mimeType } };
        const productList = allProducts.map((p: Product) => `- ${p.name} (Category: ${p.category})`).join('\n');
        
        const combinedPrompt = `
            You are an AI interior designer. Your two-step task is:
            1. Redesign the room from the user's image in a "${style}" style.
            2. Analyze the furniture in your new design and select 3-4 matching items from the provided catalog.

            Your output MUST be a single JSON object with two keys: "generatedImage" (the new image as a base64 string) and "recommendedProductNames" (an array of the selected product names).
            
            Product Catalog:
            ${productList}
        `;

        const result = await generativeModel.generateContent([combinedPrompt, imagePart]);
        const responseObject = extractJson(result.response.text(), "Combined Step");
        
        res.status(200).json(responseObject);

    } catch (error) {
        console.error("Error in the final room makeover process:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        res.status(500).json({ error: `Server error: ${errorMessage}` });
    }
}

// --- MAIN HANDLER ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.body.action === 'roomMakeover') {
            await handleRoomMakeover(req, res);
        } else {
            res.status(400).json({ error: 'Invalid or unsupported action.' });
        }
    } catch (error) {
        console.error("Handler error:", error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message || 'Server error.' });
        } else {
            res.status(500).json({ error: 'An unknown error occurred.' });
        }
    }
}
