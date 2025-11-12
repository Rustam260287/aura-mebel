// pages/api/generate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from '@google/genai';
import type { Product, ChatMessage } from '../../types';
import { imageUrlToBase64 } from '../../utils';

// ... (getAiInstance и safeJsonParse без изменений)

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
    const result = await model.generateContent({ contents: [{ parts: [imagePart, textPart] }] });
    const resultPart = result.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!resultPart?.inlineData?.data) {
        throw new Error("Не удалось сгенерировать изображение.");
    }
    res.status(200).json({ generatedImage: resultPart.inlineData.data });
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
            default: res.status(400).json({ error: 'Invalid action.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message || 'Server error.' });
    }
}
