
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, getAdminStorage } from '../../../lib/firebaseAdmin';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fetch from 'node-fetch'; // Explicit import for node environment if needed, or global

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
    // Добавили imageUrls в выборку
    const snapshot = await db.collection('products').select('name', 'category', 'price', 'imageUrls').get();
    return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name, 
        category: doc.data().category,
        price: doc.data().price,
        imageUrls: doc.data().imageUrls || [] 
    }));
}

async function generateTextContent(topic: string, products: any[]): Promise<any> {
    // В промпт не включаем URL картинок, чтобы не тратить токены
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
      "imagePrompt": "Подробное описание изображения для обложки статьи на английском языке (для генерации через DALL-E). Описание должно быть визуальным, фотореалистичным и уютным.",
      "relatedProducts": ["id1", "id2", "id3"] // Массив ID упомянутых или подходящих товаров (3-5 штук)
    }`;

    // Используем переменную, если она есть, иначе пытаемся читать из process.env
    const apiKey = process.env.ARTEMOX_API_KEY;
    const baseUrl = process.env.ARTEMOX_BASE_URL;

    // Fallback to OpenAI text generation if Artemox not configured, 
    // but preserving original logic here for text. 
    // Assuming text generation works fine as is.
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
    const data: any = await response.json();
    return extractJson(data.candidates[0].content.parts[0].text);
}

// Функция генерации изображений через OpenAI DALL-E 3
async function generateAndUploadImage(imagePrompt: string, postId: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY not found. Skipping image generation.");
        return '';
    }

    try {
        console.log("Generating image with prompt:", imagePrompt);
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Professional interior photography, photorealistic, high quality, 4k. ${imagePrompt}`,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
            quality: "standard",
            style: "natural"
        });

        const imageBase64 = response.data[0].b64_json;
        if (!imageBase64) throw new Error("No image data returned from OpenAI");

        const buffer = Buffer.from(imageBase64, 'base64');
        const storage = getAdminStorage();
        if (!storage) throw new Error("Storage not initialized");

        const bucket = storage.bucket();
        // Сохраняем как WebP или PNG. DALL-E возвращает PNG (если url) или raw data. b64_json - это данные.
        // Сохраним как .png
        const filename = `blog/${postId}_cover.png`;
        const file = bucket.file(filename);

        await file.save(buffer, {
            metadata: { contentType: 'image/png' },
            public: true
        });

        // Получаем публичную ссылку. 
        // file.publicUrl() возвращает ссылку, которая часто требует прав доступа если бакет закрыт,
        // но мы сделали public: true.
        // Более надежный вариант для Firebase Storage:
        // https://storage.googleapis.com/BUCKET_NAME/FILE_PATH
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        
        console.log("Image uploaded to:", publicUrl);
        return publicUrl;

    } catch (error) {
        console.error("Error generating/uploading image:", error);
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
        
        // 1. Генерируем текст (используя существующий механизм Gemini/Artemox)
        const blogData = await generateTextContent(topic, products);
        console.log("Text content generated.");
        
        const postId = Date.now().toString(); // Simple ID based on timestamp
        
        // --- ЛОГИКА ВЫБОРА КАРТИНКИ ---
        let imageUrl = '';

        // 2. Пробуем сгенерировать уникальную картинку через DALL-E 3
        if (blogData.imagePrompt) {
            imageUrl = await generateAndUploadImage(blogData.imagePrompt, postId);
        }

        // 3. Если генерация не удалась, используем запасные варианты
        if (!imageUrl) {
            // Пытаемся взять картинку из первого рекомендованного товара
            if (blogData.relatedProducts && Array.isArray(blogData.relatedProducts) && blogData.relatedProducts.length > 0) {
                const firstRelatedId = blogData.relatedProducts[0];
                const relatedProduct = products.find(p => p.id === firstRelatedId);
                if (relatedProduct && relatedProduct.imageUrls && relatedProduct.imageUrls.length > 0) {
                    imageUrl = relatedProduct.imageUrls[0];
                    console.log(`Image selected from related product "${relatedProduct.name}":`, imageUrl);
                }
            }
        }

        if (!imageUrl) {
             const matchingProduct = products.find(p => 
                p.imageUrls && p.imageUrls.length > 0 && 
                (topic.toLowerCase().includes(p.category.toLowerCase()) || p.category.toLowerCase().includes(topic.toLowerCase()))
             );
             if (matchingProduct) {
                 imageUrl = matchingProduct.imageUrls[0];
                 console.log(`Image selected from matching category product "${matchingProduct.name}":`, imageUrl);
             }
        }

        if (!imageUrl) {
             imageUrl = `https://loremflickr.com/1200/630/furniture,interior/all?lock=${Math.floor(Math.random() * 100)}`;
             console.log("Image selected from LoremFlickr:", imageUrl);
        }
        // ------------------------------
        
        const newPost = { 
            id: postId, 
            ...blogData, 
            imageUrl: imageUrl, 
            status: 'draft', 
            createdAt: new Date().toISOString()
        };
        
        const db = getAdminDb();
        if (db) {
             await db.collection('blog').doc(newPost.id).set(newPost);
        }
        
        res.status(200).json({ message: 'Статья успешно создана', post: newPost });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Ошибка в /api/blog/generate:", errorMessage);
        res.status(500).json({ message: errorMessage });
    }
}
