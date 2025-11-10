import { GoogleGenAI } from "@google/genai";
import type { Product, BlogPost } from '../types';
import { imageUrlToBase64 } from "../utils";

let ai: GoogleGenAI | null = null;

function getAiInstance() {
  if (!ai) {
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
    if (!API_KEY) {
      console.error("NEXT_PUBLIC_API_KEY environment variable not set.");
      return null;
    }
    ai = new GoogleGenAI(API_KEY);
  }
  return ai;
}

const textModel = 'gemini-1.5-pro-latest';
const imageModel = 'gemini-1.5-flash-latest';

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

export const getVisualRecommendations = async (base64Image: string, mimeType: string, products: Product[]): Promise<number[]> => {
  const ai = getAiInstance();
  if (!ai) return [];
  const model = ai.getGenerativeModel({ model: textModel });
  const productList = products.map((p, index) => `${index}: ${p.name}`).join('\n');
  const imagePart = { inlineData: { data: base64Image, mimeType } };
  const textPart = { text: `Проанализируй фото. Вот нумерованный список товаров:\n${productList}\n\nВыбери 3-5 подходящих. Верни ТОЛЬКО JSON-массив с числами (индексами).` };
  const result = await model.generateContent({ contents: [{ parts: [imagePart, textPart] }] });
  return safeJsonParse<number[]>(result.response.text()) || [];
};

export const generateRoomMakeover = async (base64Image: string, mimeType: string, style: string, products: Product[]): Promise<{ generatedImage: string; recommendedProductNames: string[] }> => {
    const ai = getAiInstance();
    if (!ai) throw new Error("AI Service not initialized.");
    const model = ai.getGenerativeModel({ model: imageModel });
    const imageGenResult = await model.generateContent({ contents: [{ parts: [{ inlineData: { data: base64Image, mimeType } }, { text: `Переделай комнату в стиле "${style}".` }] }] });
    const imagePart = imageGenResult.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData) throw new Error("AI не смог сгенерировать изображение.");
    const generatedImage = imagePart.inlineData.data;

    const textModelInstance = ai.getGenerativeModel({ model: textModel });
    const productList = products.map(p => `- ${p.name}`).join('\n');
    const textPart = { text: `Это дизайн. Вот список мебели:\n${productList}\n\nОпредели 3-5 товаров. Верни JSON-массив с названиями.` };
    const productRecResult = await textModelInstance.generateContent({ contents: [{ parts: [{ inlineData: { data: generatedImage, mimeType: 'image/png' } }, textPart] }] });
    const recommendedProductNames = safeJsonParse<string[]>(productRecResult.response.text()) || [];
    return { generatedImage, recommendedProductNames };
};

export const generateBlogPost = async (allProducts: Product[]): Promise<Omit<BlogPost, 'id' | 'imageUrl'> & { imageBase64: string }> => {
    const ai = getAiInstance();
    if (!ai) throw new Error("AI Service not initialized.");
    const model = ai.getGenerativeModel({ model: textModel });
    const productSample = allProducts.slice(0, 15).map(p => ({ name: p.name, id: p.id }));
    const blogPrompt = `Ты — AI-копирайтер... (промпт без изменений)`;

    const blogResult = await model.generateContent(blogPrompt);
    const blogData = safeJsonParse<Omit<BlogPost, 'id' | 'imageUrl'>>(blogResult.response.text());
    if (!blogData?.imagePrompt) throw new Error("AI не смог сгенерировать данные статьи.");

    const imageModelInstance = ai.getGenerativeModel({ model: imageModel });
    const imageResult = await imageModelInstance.generateContent(blogData.imagePrompt);
    const imagePart = imageResult.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData) throw new Error("AI не смог сгенерировать изображение.");

    return { ...blogData, imageBase64: imagePart.inlineData.data };
};
// ... и так далее для всех функций
