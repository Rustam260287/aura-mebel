// pages/api/generate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Product, ChatMessage } from '../../types';
import { imageUrlToBase64 } from '../../utils';

const getAiInstance = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(apiKey);
};

// ... (safeJsonParse без изменений)

// --- ОБРАБОТЧИКИ ---

async function handleRoomMakeover(req: NextApiRequest, res: NextApiResponse) { /* ... */ }
async function handleStagedImage(req: NextApiRequest, res: NextApiResponse) { /* ... */ }
async function handleChat(req: NextApiRequest, res: NextApiResponse) { /* ... */ }

async function handleConfigDescription(req: NextApiRequest, res: NextApiResponse) {
    const { productName, selectedOptions } = req.body;
    if (!productName || !selectedOptions) {
        return res.status(400).json({ error: 'Missing parameters for config description.' });
    }
    const ai = getAiInstance();
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    const prompt = `Создай краткое (2-3 предложения), привлекательное описание для конфигурации товара "${productName}". Характеристики: ${JSON.stringify(selectedOptions)}.`;
    const result = await model.generateContent(prompt);
    res.status(200).json({ description: result.response.text() });
}

async function handleConfigImage(req: NextApiRequest, res: NextApiResponse) {
    const { base64, mimeType, productName, visualPrompt } = req.body;
    if (!base64 || !mimeType || !productName || !visualPrompt) {
        return res.status(400).json({ error: 'Missing parameters for config image.' });
    }
    const ai = getAiInstance();
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const imagePart = { inlineData: { data: base64, mimeType } };
    const textPart = { text: `Сгенерируй новое изображение товара "${productName}" на основе этого фото, применив следующие характеристики: ${visualPrompt}. Сохраняй фон.` };
    const result = await model.generateContent([textPart, imagePart]);
    const resultPart = result.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!resultPart?.inlineData?.data) {
        throw new Error("Не удалось сгенерировать изображение.");
    }
    res.status(200).json({ generatedImage: resultPart.inlineData.data });
}

async function handleFurnitureFromPhoto(req: NextApiRequest, res: NextApiResponse) {
    const { base64, mimeType, dimensions } = req.body;
    // ... (логика обработки furnitureFromPhoto)
}

async function handleSeoProductDescription(req: NextApiRequest, res: NextApiResponse) {
    const { product } = req.body;
    // ... (логика обработки seoProductDescription)
}

async function handleStyleRecommendations(req: NextApiRequest, res: NextApiResponse) {
    const { prompt, allProducts } = req.body;
    // ... (логика обработки styleRecommendations)
}

async function handleChangeUpholstery(req: NextApiRequest, res: NextApiResponse) {
    const { base64, mimeType, prompt } = req.body;
    // ... (логика обработки changeUpholstery)
}

async function handleAnalyzeChatLogs(req: NextApiRequest, res: NextApiResponse) {
    const { chatLogs } = req.body;
    // ... (логика обработки analyzeChatLogs)
}

async function handleGenerateBlogPost(req: NextApiRequest, res: NextApiResponse) {
    const { allProducts } = req.body;
    // ... (логика обработки generateBlogPost)
}

// --- ГЛАВНЫЙ ОБРАБОТЧИК ---

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // ... (switch-case, как и ранее)
    try {
        switch (req.body.action) {
            case 'roomMakeover': await handleRoomMakeover(req, res); break;
            case 'stagedImage': await handleStagedImage(req, res); break;
            case 'chat': await handleChat(req, res); break;
            case 'configDescription': await handleConfigDescription(req, res); break;
            case 'configImage': await handleConfigImage(req, res); break;
            case 'furnitureFromPhoto': await handleFurnitureFromPhoto(req, res); break;
            case 'seoProductDescription': await handleSeoProductDescription(req, res); break;
            case 'styleRecommendations': await handleStyleRecommendations(req, res); break;
            case 'changeUpholstery': await handleChangeUpholstery(req, res); break;
            case 'analyzeChatLogs': await handleAnalyzeChatLogs(req, res); break;
            case 'generateBlogPost': await handleGenerateBlogPost(req, res); break;
            default: res.status(400).json({ error: 'Invalid action.' });
        }
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message || 'Server error.' });
        } else {
            res.status(500).json({ error: 'An unknown error occurred.' });
        }
    }
}
