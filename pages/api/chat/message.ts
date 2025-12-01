
import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAdminDb } from '../../../lib/firebaseAdmin';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

function cleanText(text: string): string {
    if (!text) return '';
    return text
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/\n+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/Техническая информация:/i, "")
        .replace(/Описание/i, "")
        .trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'API key not configured' });
    }

    const db = getAdminDb();
    let productsContext = "";
    
    // Получаем контекст
    if (db) {
        const snapshot = await db.collection('products')
            .select('name', 'category', 'price', 'description')
            .limit(60) 
            .get();
            
        const products = snapshot.docs.map(doc => {
            const d = doc.data();
            const cleanDesc = cleanText(d.description || '');
            return `[ID: ${doc.id}] ${d.name} (${d.category}): ${d.price} руб. ${cleanDesc.substring(0, 100)}...`;
        }).join('\n');
        productsContext = products;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });

    const systemInstruction = `
    Ты — эксперт-консультант мебельного бутика "Labelcom".
    
    КАТАЛОГ ТОВАРОВ:
    ${productsContext}
    
    ФОРМАТ ОТВЕТА (JSON):
    {
      "reply": "Текст ответа. Используй markdown для жирного текста.",
      "recommendedProductIds": ["ID_1", "ID_2"] // Массив ID рекомендуемых товаров (макс 3).
    }
    
    Правила:
    1. Если рекомендуешь товар, обязательно добавь его ID в массив.
    2. Будь краток и убедителен.
    `;

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
                parts: [{ text: JSON.stringify({ reply: "Здравствуйте! Чем могу помочь?", recommendedProductIds: [] }) }]
            },
            ...chatHistory
        ],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();
    
    let jsonResponse;
    try {
        jsonResponse = JSON.parse(responseText);
    } catch (e) {
        jsonResponse = { reply: responseText, recommendedProductIds: [] };
    }

    // --- ОБОГАЩЕНИЕ ДАННЫМИ ---
    // Если есть ID, достаем полные данные из базы (картинку, название)
    let products = [];
    if (jsonResponse.recommendedProductIds && jsonResponse.recommendedProductIds.length > 0 && db) {
        try {
            // Firestore 'in' query поддерживает до 10 ID
            const ids = jsonResponse.recommendedProductIds.slice(0, 10);
            if (ids.length > 0) {
                const productsSnapshot = await db.collection('products')
                    .where(admin.firestore.FieldPath.documentId(), 'in', ids)
                    .select('name', 'price', 'imageUrls', 'category')
                    .get();
                
                products = productsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }
        } catch (e) {
            console.error("Error fetching recommended products:", e);
        }
    }

    res.status(200).json({ 
        reply: jsonResponse.reply, 
        products: products 
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}

// Нужно импортировать admin для FieldPath, если getAdminDb возвращает инстанс без статики
import admin from 'firebase-admin';
