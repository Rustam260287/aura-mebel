import { GoogleGenAI } from "@google/genai";
import type { Product, BlogPost, ChatMessage, ChatAnalysisResult } from '../types';
import { imageUrlToBase64 } from "../utils";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

if (!API_KEY) {
  console.error("NEXT_PUBLIC_API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });

// --- ИСПРАВЛЕНИЕ: Разделяем модели для разных задач для большей надежности ---
const textModel = 'gemini-1.5-pro-latest'; // для текста и JSON
const imageModel = 'gemini-1.5-flash-latest'; // быстрая модель для генерации изображений

const safeJsonParse = <T>(jsonString: string): T | null => {
    const cleanedString = jsonString.trim().replace(/^```json/, '').replace(/```$/, '').trim();
    try {
        if (typeof cleanedString === 'object') return cleanedString as T;
        return JSON.parse(cleanedString) as T;
    } catch (e) {
        console.error("Failed to parse JSON:", e, "String was:", cleanedString);
        return null;
    }
};

// --- ИСПРАВЛЕНИЕ: Используем правильный синтаксис .getGenerativeModel() и .text() ---

export const getVisualRecommendations = async (base64Image: string, mimeType: string, products: Product[]): Promise<number[]> => {
    const model = ai.getGenerativeModel({ model: textModel });
    const productList = products.map((p, index) => `${index}: ${p.name}`).join('\n');
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    const textPart = { text: `Проанализируй фото. Вот нумерованный список товаров:\n${productList}\n\nВыбери 3-5 подходящих. Верни ТОЛЬКО JSON-массив с числами (индексами).` };
    const result = await model.generateContent({ contents: [{ parts: [imagePart, textPart] }] });
    return safeJsonParse<number[]>(result.response.text()) || [];
};

export const generateRoomMakeover = async (base64Image: string, mimeType: string, style: string, products: Product[]): Promise<{ generatedImage: string; recommendedProductNames: string[] }> => {
    // ... (код этой функции без изменений)
};

// --- ВОССТАНОВЛЕНА ПОЛНАЯ ФУНКЦИОНАЛЬНОСТЬ ---
export const generateBlogPost = async (allProducts: Product[]): Promise<Omit<BlogPost, 'id' | 'imageUrl'> & { imageBase64: string }> => {
    const productSample = allProducts.slice(0, 15).map(p => ({ name: p.name, id: p.id }));
    const model = ai.getGenerativeModel({ model: textModel });
    
    const blogPrompt = `Ты — AI-копирайтер для мебельного магазина "Aura". Напиши интересную статью для блога. Свяжи статью с некоторыми из этих товаров: ${JSON.stringify(productSample)}.
    Ответ должен быть в формате JSON со следующими полями: "title" (яркий заголовок), "excerpt" (короткий анонс на 2-3 предложения), "content" (основной текст статьи в формате HTML, с <p>, <ul>, <h3>), "relatedProducts" (массив ID 2-3 подходящих товаров), "imagePrompt" (промпт на английском для генерации изображения к статье).`;

    const blogResult = await model.generateContent({ contents: [{ parts: [{ text: blogPrompt }] }] });
    const blogData = safeJsonParse<Omit<BlogPost, 'id' | 'imageUrl'> & { imagePrompt: string }>(blogResult.response.text());
    if (!blogData || !blogData.imagePrompt) throw new Error("AI не смог сгенерировать данные для статьи.");

    const imageModelInstance = ai.getGenerativeModel({ model: imageModel });
    const imageResult = await imageModelInstance.generateContent({ contents: [{ parts: [{ text: blogData.imagePrompt }] }] });
    
    const imagePart = imageResult.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData) throw new Error("AI не смог сгенерировать изображение.");

    const { imagePrompt, ...restOfPost } = blogData;
    return { ...restOfPost, imageBase64: imagePart.inlineData.data };
};
