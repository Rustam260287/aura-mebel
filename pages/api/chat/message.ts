
import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import admin from 'firebase-admin';

// Используем переменную окружения для ключа API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY in environment variables.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

    const db = getAdminDb();
    let productsContext = "";
    
    if (db) {
        const snapshot = await db.collection('products')
            .select('name', 'category', 'price', 'description_main')
            .limit(100) 
            .get();
            
        const products = snapshot.docs.map(doc => {
            const d = doc.data();
            const cleanDesc = cleanText(d.description_main || '');
            return `[ID: ${doc.id}] ${d.name} (${d.category}): ${d.price} руб. ${cleanDesc.substring(0, 100)}...`;
        }).join('\n');
        productsContext = products;
    }

    const systemInstruction = `
    ТВОЯ РОЛЬ:
    Ты — **лучший в мире эксперт по мебели и дизайну интерьера**, а также ведущий консультант бутика "Aura Mebel".
    Твоя задача — влюблять клиента в нашу мебель и вести его к покупке.

    НАШЕ ГЛАВНОЕ ПРЕИМУЩЕСТВО (УТП):
    **Мы производим мебель на заказ!** Любые размеры, ткани, цвет и дизайн.
    Если в каталоге нет идеального варианта — предложи сделать его индивидуально.

    ГОТОВЫЙ КАТАЛОГ (Для быстрых продаж):
    ${productsContext}
    
    СТРАТЕГИЯ ПРОДАЖ (Будь активным!):
    1. **Экспертиза:** Если клиент спрашивает совет ("какой диван лучше для кота?"), дай профессиональный ответ (антивандальный флок/велюр) и объясни почему.
    2. **Выявление потребностей:** Задавай уточняющие вопросы: "Какой размер комнаты?", "Какой стиль вы предпочитаете?".
    3. **Индивидуальный подход:** Если клиент хочет "такой же, но другого цвета" — скажи: "Без проблем! Мы изготовим эту модель в любом цвете и размере специально для вас".
    4. **Стиль общения:** Премиальный, уверенный, заботливый.

    ФОРМАТ ОТВЕТА (JSON):
    {
      "reply": "Текст ответа. Используй Markdown для акцентов (**жирный**).",
      "recommendedProductIds": ["ID_1", "ID_2"]
    }
    `;

    const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: systemInstruction }] },
            { role: "model", parts: [{ text: "Здравствуйте! Я ваш персональный стилист по мебели. Чем могу помочь?" }] },
            ...history.map((msg: any) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }))
        ],
        generationConfig: {
            maxOutputTokens: 2048,
        },
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();
    
    let jsonResponse;
    try {
        const jsonString = responseText.match(/```json\n([\s\S]*?)\n```/)[1];
        jsonResponse = JSON.parse(jsonString);
    } catch (e) {
        jsonResponse = { reply: responseText.replace(/```json\n|```/g, ''), recommendedProductIds: [] };
    }

    let products = [];
    if (jsonResponse.recommendedProductIds && jsonResponse.recommendedProductIds.length > 0 && db) {
        try {
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
