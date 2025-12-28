
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb, getAdminStorage } from '../../../lib/firebaseAdmin';
import { askAI } from '../../../lib/ai/core';
import OpenAI from 'openai';

async function getAllProductsSummary() {
    const db = getAdminDb();
    if (!db) return [];
    const snapshot = await db.collection('products').select('name', 'category', 'imageUrls').get();
    return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name, 
        category: doc.data().category,
        imageUrls: doc.data().imageUrls || [] 
    }));
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

        const imageBase64 = response.data?.[0]?.b64_json;
        if (!imageBase64) throw new Error("No image data returned from OpenAI");

        const buffer = Buffer.from(imageBase64, 'base64');
        const storage = getAdminStorage();
        if (!storage) throw new Error("Storage not initialized");

        const bucket = storage.bucket();
        const filename = `blog/${postId}_cover.png`;
        const file = bucket.file(filename);

        await file.save(buffer, {
            metadata: { contentType: 'image/png' },
            public: true
        });

        // Формируем публичную ссылку
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
        
        // 1. Генерируем текст через единый AI Core
        // Можно передавать список товаров, если хотим, чтобы AI их вплетал
        // Для простоты пока передаем тему, но можем расширить промпт в будущем
        
        const blogData: any = await askAI({
            key: 'BLOG_POST',
            variables: { topic },
            responseFormat: 'json',
            model: 'gpt-4o'
        });

        console.log("Text content generated.");
        
        const postId = Date.now().toString(); 
        
        // --- ЛОГИКА ВЫБОРА КАРТИНКИ ---
        let imageUrl = '';

        // 2. Пробуем сгенерировать уникальную картинку через DALL-E 3
        // Для экономии можно отключить и брать картинку товара, если blogData.relatedProducts есть
        if (blogData.imagePrompt) {
            imageUrl = await generateAndUploadImage(blogData.imagePrompt, postId);
        }

        // 3. Запасные варианты картинок
        if (!imageUrl) {
            if (blogData.relatedProducts && Array.isArray(blogData.relatedProducts) && blogData.relatedProducts.length > 0) {
                // Если AI вернул ID товаров, ищем их фото
                // Так как AI может "придумать" ID или мы не передали ему весь список, 
                // эта логика может не сработать, если мы не включили ID товаров в промпт.
                // Но мы можем попробовать найти похожие товары по категории из топика.
            }
             
             // Поиск по категории
             const matchingProduct = products.find(p => 
                p.imageUrls && p.imageUrls.length > 0 && 
                (topic.toLowerCase().includes(p.category.toLowerCase()) || p.category.toLowerCase().includes(topic.toLowerCase()))
             );
             if (matchingProduct) {
                 imageUrl = matchingProduct.imageUrls[0];
             }
        }

        if (!imageUrl) {
             imageUrl = `https://loremflickr.com/1200/630/furniture,interior/all?lock=${Math.floor(Math.random() * 100)}`;
        }
        
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
