
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';

// Эта функция остается, она нам понадобится
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
    const snapshot = await db.collection('products').select('name', 'category').get();
    return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, category: doc.data().category }));
}

async function generateTextContent(topic: string, products: any[]): Promise<any> {
    const productsList = products.map(p => `- ID: ${p.id}, Название: "${p.name}", Категория: ${p.category}`).join('\n');
    const fullPrompt = `Напиши статью для блога мебельного магазина "Labelcom" на тему: "${topic}". Включи подзаго-ловки, списки, выдели важное. В конце подбери 3-5 подходящих товаров из списка ниже.
    
    СПИСОК ТОВАРОВ:
    ${productsList}

    В ответ верни ТОЛЬКО JSON-объект в блоке \`\`\`json ... \`\`\` со структурой:
    {
      "title": "...",
      "excerpt": "...",
      "content": "(HTML формат)",
      "imagePrompt": "(промпт для картинки на английском)",
      "relatedProducts": ["id1", "id2"]
    }`;

    const API_URL = `${process.env.ARTEMOX_BASE_URL}/models/gemini-1.5-flash:generateContent`;
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.ARTEMOX_API_KEY}` },
        body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка API генерации текста (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    return extractJson(data.candidates[0].content.parts[0].text);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    try {
        const { topic } = req.body;
        if (!topic) return res.status(400).json({ message: 'Тема статьи обязательна' });

        const products = await getAllProductsSummary();
        const blogData = await generateTextContent(topic, products);
        
        // **ИЗМЕНЕНИЕ:** Просто сохраняем пост без картинки, добавляем статус draft
        const newPost = { 
            id: new Date().toISOString(), 
            ...blogData, 
            imageUrl: '', 
            status: 'draft', 
            createdAt: new Date().toISOString() 
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
