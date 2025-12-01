
import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAdminDb } from '../../../lib/firebaseAdmin';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY; // Перешли на Gemini
    if (!apiKey) {
      return res.status(500).json({ message: 'API key not configured' });
    }

    // 1. Fetch Products Context (Кэширование можно добавить позже)
    const db = getAdminDb();
    let productsContext = "";
    
    try {
        if (db) {
            // Берем только основные поля и ограничиваем кол-во, чтобы влезть в контекст
            const snapshot = await db.collection('products')
                .select('name', 'category', 'price', 'description')
                .limit(50) 
                .get();
                
            const products = snapshot.docs.map(doc => {
                const d = doc.data();
                return `- ${d.name} (${d.category}): ${d.price} руб. ${d.description ? d.description.substring(0, 100) : ''}...`;
            }).join('\n');
            productsContext = products;
        }
    } catch (e) {
        console.warn("Failed to fetch products context:", e);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 2. System Instruction
    const systemInstruction = `
    Ты — эксперт-консультант мебельного бутика "Labelcom".
    Твоя цель: помочь клиенту выбрать мебель, консультировать по стилю и продавать.
    
    КОНТЕКСТ ТОВАРОВ МАГАЗИНА:
    ${productsContext}
    
    ПРАВИЛА:
    1. Будь вежлив, профессионален и лаконичен (макс 3-4 предложения).
    2. Если спрашивают про мебель — рекомендуй ТОЛЬКО товары из списка выше. Указывай цену.
    3. Если товара нет в списке, предложи посмотреть "Каталог" или спроси уточняющие вопросы.
    4. Отвечай на том языке, на котором пишет пользователь (обычно Русский).
    5. Не выдумывай несуществующие товары.
    `;

    // 3. Формируем историю чата для Gemini
    // Gemini принимает историю в формате { role: 'user' | 'model', parts: [{ text: ... }] }
    const chatHistory = (history || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: "System Instruction: " + systemInstruction }]
            },
            {
                role: "model",
                parts: [{ text: "Понял. Я готов консультировать клиентов Labelcom." }]
            },
            ...chatHistory
        ],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.status(200).json({ reply });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
