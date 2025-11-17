// pages/api/gemini.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { VertexAI } from '@google-cloud/vertexai';
import type { Product, FurnitureBlueprint, ChatMessage, ChatAnalysisResult, BlogPost } from '../../types';
import fs from 'fs';
import path from 'path';

const keyFilePath = path.join(process.cwd(), 'google-credentials.json');
let credentials;
try {
  const keyFileContent = fs.readFileSync(keyFilePath, 'utf8');
  credentials = JSON.parse(keyFileContent);
} catch (error)  {
  console.error("!!! НЕ УДАЛОСЬ ЗАГРУЗИТЬ google-credentials.json !!!", error);
}

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
// ПОСЛЕДНЯЯ ПОПЫТКА: Меняем регион на us-east1
const LOCATION = 'us-east1';

const vertex_ai = new VertexAI({ project: PROJECT_ID || '', location: LOCATION, credentials });

// Используем самые базовые и стабильные идентификаторы моделей
const MODEL_CONFIG = {
  text: 'gemini-pro',
  vision: 'gemini-pro-vision',
};

const safeJsonParse = <T>(text: string): T => {
    try {
        const match = text.match(/```json\n([\s\S]*?)\n```/);
        const parsable = match ? match[1] : text;
        return JSON.parse(parsable) as T;
    } catch (e) {
        throw new Error(`AI returned invalid JSON: ${text}`);
    }
};

const callGenerativeModel = async (modelName: string, prompt: any, isJson = true) => {
    const generativeModel = vertex_ai.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: isJson ? "application/json" : "text/plain" }
    });
    const result = await generativeModel.generateContent(prompt);
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return isJson ? safeJsonParse(responseText) : responseText;
};

async function handleStyleRecommendations(req: NextApiRequest, res: NextApiResponse) {
    const { prompt, productNames } = req.body;
    const fullPrompt = `Запрос: "${prompt}". Каталог: ${productNames.join(', ')}. Верни JSON {"recommendedProductNames": ["Товар 1", "Товар 2"]}.`;
    const result = await callGenerativeModel(MODEL_CONFIG.text, fullPrompt);
    res.status(200).json(result);
}
async function handleVisualSearch(req: NextApiRequest, res: NextApiResponse) {
    const { base64, mimeType, allProducts } = req.body;
    const productList = allProducts.map((p: Product) => `- ${p.name} (${p.category})`).join('\n');
    const prompt = [{ inlineData: { data: base64, mimeType } }, { text: `Анализируй фото. Каталог:\n${productList}\nПорекомендуй 3-5 товаров. Верни JSON {"recommendedProductNames": ["Товар 1"]}.` }];
    const result = await callGenerativeModel(MODEL_CONFIG.vision, prompt);
    res.status(200).json(result);
}
async function handleRoomMakeover(req: NextApiRequest, res: NextApiResponse) {
    const { base64, mimeType, style, allProducts } = req.body;
    const imagePart = { inlineData: { data: base64, mimeType } };
    const productList = allProducts.map((p: Product) => p.name).join(', ');
    const prompt = [{ text: `Задача: 1. Переделай комнату в стиле "${style}". 2. Из нового фото выбери 3-4 товара из списка: ${productList}. Верни JSON {"generatedImage": "base64...", "recommendedProductNames": ["Товар 1"]}.` }, imagePart];
    const result = await callGenerativeModel(MODEL_CONFIG.vision, prompt);
    res.status(200).json(result);
}
async function handleGenerateConfiguredImage(req: NextApiRequest, res: NextApiResponse) {
    const { base64, mimeType, productName, visualPrompt } = req.body;
    const prompt = [{ text: `Измени предмет (${productName}) так: ${visualPrompt}. Сохрани фон. Верни JSON {"generatedImage": "base64..."}.` }, { inlineData: { data: base64, mimeType } }];
    const result = await callGenerativeModel(MODEL_CONFIG.vision, prompt);
    res.status(200).json(result);
}
async function handleConfigDescription(req: NextApiRequest, res: NextApiResponse) {
    const { productName, selectedOptions } = req.body;
    const optionsString = Object.entries(selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ');
    const prompt = `Напиши описание для товара "${productName}" с опциями: ${optionsString}. Верни JSON {"description": "..."}.`;
    const result = await callGenerativeModel(MODEL_CONFIG.text, prompt);
    res.status(200).json(result);
}
async function handleStageFurniture(req: NextApiRequest, res: NextApiResponse) {
    const { roomBase64, roomMimeType, productBase64, productMimeType, productName } = req.body;
    const prompt = `Размести товар '${productName}' (второе фото) в комнате (первое фото). Верни JSON {"stagedImage": "base64..."}.`;
    const result = await callGenerativeModel(MODEL_CONFIG.vision, [prompt, {inlineData: {data: roomBase64, mimeType: roomMimeType}}, {inlineData: {data: productBase64, mimeType: productMimeType}}]);
    res.status(200).json(result);
}
async function handleGenerateBlogPost(req: NextApiRequest, res: NextApiResponse) {
    const { allProducts } = req.body;
    const productSample = allProducts.slice(0, 10).map((p:Product) => ({ id: p.id, name: p.name }));
    const prompt = `Напиши статью для блога мебельного магазина. Упомяни 2-3 товара из списка: ${JSON.stringify(productSample)}. Верни JSON { "title": "...", "excerpt": "...", "content": "<p>...</p>", "relatedProducts": ["id1"], "imagePrompt": "a prompt in english for an image..." }.`;
    const contentResult = await callGenerativeModel(MODEL_CONFIG.text, prompt) as Omit<BlogPost, 'id'|'imageUrl'>;
    const imagePrompt = `Изображение для блога: ${contentResult.imagePrompt}. Верни JSON {"generatedImage": "base64..."}.`;
    const imageResult = await callGenerativeModel(MODEL_CONFIG.vision, imagePrompt) as { generatedImage: string };
    res.status(200).json({ ...contentResult, imageBase64: imageResult.generatedImage });
}
async function handleFurnitureFromPhoto(req: NextApiRequest, res: NextApiResponse) {
    const { base64, mimeType, dimensions } = req.body;
    const prompt = [{ text: `Анализируй фото мебели для габаритов ${dimensions.width}x${dimensions.height}x${dimensions.depth} см. Верни JSON { "furnitureName": "...", "blueprint": { ... }, "priceEstimate": { ... } }.` }, { inlineData: { data: base64, mimeType } }];
    const result = await callGenerativeModel(MODEL_CONFIG.text, prompt);
    res.status(200).json(result);
}
async function handleAnalyzeChatLogs(req: NextApiRequest, res: NextApiResponse) {
    const { chatLogs } = req.body;
    const prompt = `Анализируй чаты: ${JSON.stringify(chatLogs.slice(-20))}. Верни JSON { "actionableInsights": [...], "themes": [...], "mentionedProducts": [...], "commonQuestions": [...] }.`;
    const result = await callGenerativeModel(MODEL_CONFIG.text, prompt);
    res.status(200).json(result);
}
async function handleChat(req: NextApiRequest, res: NextApiResponse) {
    const { messages, allProducts } = req.body;
    const productList = allProducts.map((p: Product) => `- ${p.name}`).join('\n');
    const history = messages.slice(0, -1).map((msg: ChatMessage) => ({ role: msg.role, parts: [{ text: msg.content }] }));
    const currentMessage = messages[messages.length - 1].content;
    
    const model = vertex_ai.getGenerativeModel({
      model: MODEL_CONFIG.text,
      systemInstruction: `Ты — "Aura Assist", помощник магазина "Aura Мебель". Отвечай на русском, используй Markdown, ссылайся на товары: ${productList}`
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(currentMessage);
    const reply = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.status(200).json({ reply });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Метод не разрешен' });
    try {
        if (!credentials) {
            throw new Error("Аутентификация Vertex AI не удалась: файл google-credentials.json не найден или некорректен.");
        }
        const { action } = req.body;
        const actions: Record<string, Function> = {
            styleRecommendations: handleStyleRecommendations,
            visualSearch: handleVisualSearch,
            roomMakeover: handleRoomMakeover,
            generateConfiguredImage: handleGenerateConfiguredImage,
            configDescription: handleConfigDescription,
            stageFurniture: handleStageFurniture,
            generateBlogPost: handleGenerateBlogPost,
            furnitureFromPhoto: handleFurnitureFromPhoto,
            analyzeChatLogs: handleAnalyzeChatLogs,
            chat: handleChat,
        };
        if (actions[action]) return await actions[action](req, res);
        res.status(400).json({ error: 'Неверное действие.' });
    } catch (error) {
        console.error(`Ошибка в /api/gemini (action: ${req.body.action}):`, error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Неизвестная ошибка.' });
    }
}
