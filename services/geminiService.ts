import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Product, BlogPost, ChatMessage, ChatAnalysisResult } from '../types';
import { imageUrlToBase64 } from "../utils";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A console error is better than throwing, as it may prevent the app from rendering.
  // The AI features will fail gracefully with a missing key.
  console.error("API_KEY environment variable not set. AI features will not work.");
}

// FIX: Initialize GoogleGenAI with a named apiKey object.
const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" });

const textModel = 'gemini-2.5-flash';
const proModel = 'gemini-2.5-pro';
const imageModel = 'gemini-2.5-flash-image';

// Helper to safely parse JSON
const safeJsonParse = <T>(jsonString: string): T | null => {
    try {
        // Attempt to parse the string. If it's already an object (which can happen), just return it.
        if (typeof jsonString === 'object') return jsonString as T;
        return JSON.parse(jsonString) as T;
    } catch (e) {
        console.error("Failed to parse JSON:", e, "String was:", jsonString);
        return null;
    }
};


export const getStyleRecommendations = async (prompt: string, products: Product[]): Promise<string[]> => {
    const productNames = products.map(p => p.name);

    const response = await ai.models.generateContent({
        model: textModel,
        contents: `Пользователь ищет мебель для своего интерьера. Вот его описание: "${prompt}". А вот список доступных товаров: ${productNames.join(', ')}. Пожалуйста, верни JSON-массив с названиями самых подходящих товаров из списка. Не включай ничего, чего нет в списке. Верни только JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    
    const result = safeJsonParse<string[]>(response.text);
    return result || [];
};

export const getVisualRecommendations = async (base64Image: string, mimeType: string, products: Product[]): Promise<string[]> => {
    const productList = products.map(p => `- ${p.name} (${p.category})`).join('\n');

    const imagePart = {
        inlineData: { data: base64Image, mimeType },
    };
    const textPart = {
        text: `Проанализируй стиль интерьера на этом фото. Вот список доступных товаров:\n${productList}\n\nПожалуйста, порекомендуй 3-5 самых подходящих товаров из списка. Верни JSON-массив только с их названиями.`,
    };

    const response = await ai.models.generateContent({
        model: textModel,
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });

    const result = safeJsonParse<string[]>(response.text);
    return result || [];
};

export const generateRoomMakeover = async (base64Image: string, mimeType: string, style: string, products: Product[]): Promise<{ generatedImage: string; recommendedProductNames: string[] }> => {
    // Step 1: Generate the redesigned room image.
    const imageGenResponse = await ai.models.generateContent({
        model: imageModel,
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType } },
                { text: `Полностью переделай интерьер этой комнаты в стиле "${style}". Замени существующую мебель новой, подходящей по стилю. Сделай изображение фотореалистичным. Сохрани архитектуру комнаты (окна, двери, стены).` }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE],
        }
    });
    
    const imagePart = imageGenResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
    // Improved error handling for image generation
    if (!imagePart || !imagePart.inlineData) {
        const finishReason = imageGenResponse.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY') {
             throw new Error("Не удалось создать изображение из-за ограничений безопасности. Пожалуйста, попробуйте другое фото или выберите другой стиль.");
        }
        throw new Error("AI не смог сгенерировать изображение комнаты. Пожалуйста, попробуйте еще раз.");
    }
    const generatedImage = imagePart.inlineData.data;

    // Step 2: Analyze the generated image to find matching products.
    // Wrap this in a try/catch to allow partial success (image generated, but products not found)
    try {
        const productList = products.map(p => `- ${p.name} (Категория: ${p.category})`).join('\n');

        const productRecResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Use the faster model for stability
            contents: {
                parts: [
                    { inlineData: { data: generatedImage, mimeType: 'image/png' } },
                    { text: `Это сгенерированный ИИ-дизайн интерьера. Вот список доступной мебели:\n${productList}\n\nОпредели, какие 3-5 товаров из этого списка наиболее точно соответствуют мебели на сгенерированном изображении. Верни JSON-массив с точными названиями товаров из списка. Не выдумывай названия.` }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        
        const recommendedProductNames = safeJsonParse<string[]>(productRecResponse.text) || [];
        return { generatedImage, recommendedProductNames };

    } catch (e) {
        console.error("AI product recommendation failed after image generation:", e);
        // Partial success: return the generated image but with empty recommendations.
        // The UI can then show the image and a message about products.
        return { generatedImage, recommendedProductNames: [] };
    }
};


export const getAiConfigurationDescription = async (productName: string, options: Record<string, string>): Promise<string> => {
    const optionsString = Object.entries(options).map(([key, value]) => `${key}: ${value}`).join(', ');
    const response = await ai.models.generateContent({
        model: textModel,
        contents: `Напиши короткое, привлекательное и "вкусное" описание для товара "${productName}" с выбранными опциями: ${optionsString}. Описание должно быть в одно-два предложения.`,
    });
    return response.text;
};

export const generateConfiguredImage = async (base64Image: string, mimeType: string, productName: string, visualPrompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType } },
                { text: `Измени этот предмет мебели (${productName}), применив следующие характеристики: ${visualPrompt}. Сохрани фон и общую форму.` }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE],
        }
    });
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart || !imagePart.inlineData) {
        throw new Error("AI не вернул изображение.");
    }
    return imagePart.inlineData.data;
};

export const generateStagedImage = async (product: Product, roomBase64: string, roomMimeType: string): Promise<string> => {
    const { base64: productBase64, mimeType: productMimeType } = await imageUrlToBase64(product.imageUrls[0]);
    
    const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
            parts: [
                { inlineData: { data: roomBase64, mimeType: roomMimeType }, },
                { text: `Это фото комнаты. Пожалуйста, вставь в этот интерьер следующий предмет мебели: '${product.name}'. Вот его фото:` },
                { inlineData: { data: productBase64, mimeType: productMimeType }, },
                { text: "Постарайся сделать это максимально реалистично, сохранив освещение, тени и пропорции. Мебель должна выглядеть как часть комнаты."}
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE],
        }
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart || !imagePart.inlineData) {
        throw new Error("AI не смог разместить мебель.");
    }
    return imagePart.inlineData.data;
};

export const changeProductUpholstery = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType } },
                { text: `Измени обивку этого предмета мебели на: "${prompt}". Не меняй фон, форму и другие детали.` }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE],
        }
    });
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart || !imagePart.inlineData) {
        throw new Error("AI не смог изменить обивку.");
    }
    return imagePart.inlineData.data;
};

export const generateBlogPost = async (allProducts: Product[]): Promise<Omit<BlogPost, 'id' | 'imageUrl'> & { imageBase64: string }> => {
    const productSample = allProducts.slice(0, 15).map(p => ({ name: p.name, category: p.category, id: p.id }));
    
    const response = await ai.models.generateContent({
        model: proModel,
        contents: `Ты — AI-копирайтер для мебельного магазина "Aura". Напиши интересную статью для блога на одну из тем: скандинавский стиль, лофт, мид-сенчури, как выбрать диван, организация хранения. Свяжи статью с некоторыми из этих товаров: ${JSON.stringify(productSample)}.
        Ответ должен быть в формате JSON со следующими полями: "title" (яркий заголовок), "excerpt" (короткий анонс на 2-3 предложения), "content" (основной текст статьи в формате HTML, с параграфами <p>, списками <ul><li> и заголовками <h3>), "relatedProducts" (массив ID 2-3 подходящих товаров из списка), "imagePrompt" (промпт на английском для генерации изображения к статье, например: "a cozy scandinavian living room with a grey sofa").`,
        config: { responseMimeType: 'application/json' }
    });
    
    const blogData = safeJsonParse<Omit<BlogPost, 'id' | 'imageUrl'>>(response.text);
    if (!blogData) throw new Error("AI не смог сгенерировать данные для статьи.");

    const imageResponse = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [{ text: blogData.imagePrompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    
    const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart || !imagePart.inlineData) throw new Error("AI не смог сгенерировать изображение.");

    return { ...blogData, imageBase64: imagePart.inlineData.data };
};

export const generateSeoProductDescription = async (product: Product): Promise<string> => {
    const response = await ai.models.generateContent({
        model: textModel,
        contents: `Напиши SEO-оптимизированное описание для товара. Оно должно быть уникальным, содержать ключевые слова и призывать к покупке.
        Название: ${product.name}
        Категория: ${product.category}
        Материалы: ${product.details.material}
        Описание: ${product.description}
        Магазин: Aura Мебель`,
    });
    return response.text;
};

export const generateSeoBlogContent = async (post: BlogPost): Promise<{ title: string; excerpt: string }> => {
    const response = await ai.models.generateContent({
        model: textModel,
        contents: `Оптимизируй заголовок и анонс для этой статьи в блоге для SEO и большей привлекательности.
        Текущий заголовок: "${post.title}"
        Текущий анонс: "${post.excerpt}"
        Верни результат в формате JSON с полями "title" и "excerpt".`,
        config: { responseMimeType: "application/json" }
    });
    const result = safeJsonParse<{ title: string; excerpt: string }>(response.text);
    if (!result) throw new Error("AI не смог сгенерировать SEO-контент.");
    return result;
};


export interface FurnitureBlueprint {
  furnitureName: string;
  blueprint: {
    estimatedDimensions: string[];
    materials: string[];
  };
  priceEstimate: {
    materialsCost: number;
    laborCost: number;
    totalPrice: number;
  };
}

export const generateFurnitureFromPhoto = async (base64Image: string, mimeType: string, dimensions: { width: string; height: string; depth: string }): Promise<FurnitureBlueprint> => {
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    const textPart = {
        text: `Проанализируй изображение этой мебели. Создай план для её производства и рассчитай примерную стоимость. Желаемые габариты: Ширина ~${dimensions.width}см, Высота ~${dimensions.height}см, Глубина ~${dimensions.depth}см.
        Верни ответ в формате JSON со следующей структурой:
        {
          "furnitureName": "Название мебели (например, 'Светло-серый диван в скандинавском стиле')",
          "blueprint": {
            "estimatedDimensions": ["- Основная рама: 180x80x70 см", "- Подушки сиденья (2 шт): 90x80x15 см"],
            "materials": ["- Каркас: массив сосны", "- Обивка: серая рогожка, 15 метров", "- Наполнитель: ППУ высокой плотности"]
          },
          "priceEstimate": {
            "materialsCost": 25000, // в рублях
            "laborCost": 15000, // в рублях
            "totalPrice": 40000 // в рублях
          }
        }`,
    };

    const response = await ai.models.generateContent({
        model: proModel,
        contents: { parts: [imagePart, textPart] },
        config: { responseMimeType: 'application/json' }
    });

    const result = safeJsonParse<FurnitureBlueprint>(response.text);
    if (!result) throw new Error("AI не смог обработать изображение и создать чертеж.");
    return result;
};

export const analyzeChatLogs = async (chatLogs: ChatMessage[][]): Promise<ChatAnalysisResult> => {
    // Take the last 20 conversations to keep the prompt size reasonable
    const logsToAnalyze = chatLogs.slice(-20);
    const prompt = `
        Ты — бизнес-аналитик для мебельного магазина "Aura Мебель". Проанализируй следующие логи чатов между AI-помощником и клиентами. 
        Твоя задача — извлечь ценные инсайты для владельца магазина.

        Вот логи чатов:
        ${JSON.stringify(logsToAnalyze)}

        Проанализируй эти диалоги и верни результат в формате JSON со следующей структурой:
        {
          "actionableInsights": ["список из 2-3 конкретных предложений по улучшению бизнеса, основанных на диалогах"],
          "themes": ["список из 4-5 основных тем, которые обсуждают клиенты"],
          "mentionedProducts": ["список названий товаров, которые упоминались в чатах"],
          "commonQuestions": ["список из 3-4 самых частых вопросов от клиентов"]
        }
        
        Примеры:
        - actionableInsights: "Клиенты часто спрашивают о доставке в другие города. Рекомендуется добавить раздел 'Доставка' на сайт."
        - themes: "Доставка", "Материалы обивки", "Скидки", "Наличие товара"
        - mentionedProducts: "Скандинавский диван 'Хюгге'", "Дубовый стол 'Лес'"
        - commonQuestions: "Какие есть варианты цвета?", "Сколько стоит доставка?", "Из какого материала сделана мебель?"

        Убедись, что ответ — это валидный JSON, без лишнего текста до или после него.
    `;
    
    const response = await ai.models.generateContent({
        model: proModel,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    actionableInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
                    themes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    mentionedProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
                    commonQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                }
            }
        }
    });

    const result = safeJsonParse<ChatAnalysisResult>(response.text);
    if (!result) {
        throw new Error("Не удалось проанализировать чаты. ИИ вернул некорректный формат данных.");
    }
    return result;
};