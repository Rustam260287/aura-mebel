
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, getAdminStorage } from '../../../lib/firebaseAdmin';
import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

// Явно загружаем .env.local, если переменные еще не загружены
dotenv.config({ path: '.env.local' });

function extractJson(text: string): any {
    const jsonMatch = text.match(/```json([\s\S]*?)```|(\{[\s\S]*\})/);
    if (!jsonMatch) throw new Error("Не удалось найти JSON в ответе AI. Ответ: " + text);
    const jsonString = jsonMatch[1] || jsonMatch[2];
    if (!jsonString) throw new Error("Не удалось извлечь JSON-строку.");
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        throw new Error("Невалидный JSON от AI.");
    }
}

async function getAllProductsSummary() {
    const db = getAdminDb();
    if (!db) return [];
    const snapshot = await db.collection('products').select('name', 'category', 'price').get();
    return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name, 
        category: doc.data().category,
        price: doc.data().price 
    }));
}

async function generateTextContent(topic: string, products: any[]): Promise<any> {
    const productsList = products.map(p => `- ID: ${p.id}, Название: "${p.name}", Категория: ${p.category}, Цена: ${p.price} руб.`).join('\n');
    
    const fullPrompt = `Напиши развернутую, экспертную и вдохновляющую статью для блога мебельного магазина "Labelcom" на тему: "${topic}".
    
    ТРЕБОВАНИЯ К СТАТЬЕ:
    1. **Глубина и польза**: Распиши тему подробно. Давай конкретные советы по дизайну интерьера, выбору материалов и уходу за мебелью. Статья должна быть полезной для читателя.
    2. **Мягкая продажа (Soft Selling)**: Не используй агрессивную рекламу. Вместо этого, позиционируй товары магазина как идеальное решение проблем читателя или способ достижения уюта.
    3. **Интеграция товаров**: Органично вплетай рекомендации конкретных товаров из списка ниже ПРЯМО В ТЕКСТ статьи (в подходящие по смыслу абзацы). Называй модели по именам и объясняй, почему именно этот товар подходит в данном контексте (например, "Для классической гостиной отлично подойдет стол 'Рим' благодаря его изящным ножкам...").
    4. **Структура**: Используй привлекательные подзаголовки, маркированные списки для удобства чтения.
    5. **Объем**: Статья должна быть достаточно длинной и обстоятельной.

    СПИСОК ТОВАРОВ МАГАЗИНА (используй наиболее подходящие по теме):
    ${productsList}

    В ответ верни ТОЛЬКО JSON-объект в блоке \`\`\`json ... \`\`\` со следующей структурой:
    {
      "title": "Привлекательный заголовок статьи",
      "excerpt": "Краткий анонс для списка статей (2-3 предложения, интригующий)",
      "content": "Полный текст статьи в формате HTML. Используй теги <h2>, <h3>, <p>, <ul>, <li>, <strong>. Не используй тег <img> в тексте.",
      "imagePrompt": "Подробное описание изображения для обложки статьи на английском языке (для генерации через AI)",
      "relatedProducts": ["id1", "id2", "id3"] // Массив ID упомянутых или подходящих товаров (3-5 штук)
    }`;

    // Используем переменную, если она есть, иначе пытаемся читать из process.env
    const apiKey = process.env.ARTEMOX_API_KEY;
    const baseUrl = process.env.ARTEMOX_BASE_URL;

    const API_URL = `${baseUrl}/models/gemini-1.5-flash:generateContent`;
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка API генерации текста (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    return extractJson(data.candidates[0].content.parts[0].text);
}

async function generateAndUploadImage(imagePrompt: string, postId: string): Promise<string> {
    const hfToken = process.env.HUGGING_FACE_API_KEY;
    if (!hfToken) {
        console.warn("HUGGING_FACE_API_KEY not found in environment variables (checked .env.local), skipping image generation.");
        return '';
    }

    const hf = new HfInference(hfToken);
    const enhancedPrompt = `High quality photo of a modern furniture interior, ${imagePrompt}, realistic lighting, 4k, interior design magazine style, award winning photography`;

    try {
        console.log(`Starting image generation with prompt: "${enhancedPrompt}"`);
        const imageBlob = await hf.textToImage({
            model: 'stabilityai/stable-diffusion-xl-base-1.0',
            inputs: enhancedPrompt,
            parameters: { negative_prompt: 'blurry, low quality, distortion, ugly, text, watermark' }
        });
        
        console.log("Image generated successfully.");

        const arrayBuffer = await imageBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const storage = getAdminStorage();
        if (!storage) throw new Error("Firebase Storage not initialized");

        const bucket = storage.bucket();
        const safePostId = postId.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `blog/${safePostId}_generated.jpg`;
        const file = bucket.file(fileName);

        await file.save(buffer, {
            metadata: { contentType: 'image/jpeg' }
        });
        console.log("Image saved to storage bucket.");

        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        console.log("Public URL generated:", publicUrl);
        
        return publicUrl;

    } catch (error) {
        console.error("Image generation or upload failed:", error);
        return '';
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    try {
        const { topic } = req.body;
        if (!topic) return res.status(400).json({ message: 'Тема статьи обязательна' });

        console.log("Starting blog generation for topic:", topic);
        const products = await getAllProductsSummary();
        const blogData = await generateTextContent(topic, products);
        console.log("Text content generated. Image prompt:", blogData.imagePrompt);
        
        const postId = new Date().toISOString();
        let imageUrl = '';
        
        if (blogData.imagePrompt) {
            imageUrl = await generateAndUploadImage(blogData.imagePrompt, postId);
        } else {
            console.warn("No image prompt provided by AI.");
        }
        
        const newPost = { 
            id: postId, 
            ...blogData, 
            imageUrl: imageUrl, 
            status: 'draft', 
            createdAt: postId 
        };
        
        const db = getAdminDb();
        if (db) {
             await db.collection('blog').doc(newPost.id).set(newPost);
        }
        
        res.status(200).json({ message: 'Статья успешно создана (статус: черновик)', post: newPost });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Ошибка в /api/blog/generate:", errorMessage);
        res.status(500).json({ message: errorMessage });
    }
}
