
import { NextApiRequest, NextApiResponse } from 'next';
import RPCClient from '@alicloud/pop-core';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config({ path: '.env.local' });

const ACCESS_KEY_ID = process.env.QWEN_ACCESS_KEY_ID;
const ACCESS_KEY_SECRET = process.env.QWEN_ACCESS_KEY_SECRET;

const client = new RPCClient({
    accessKeyId: ACCESS_KEY_ID,
    accessKeySecret: ACCESS_KEY_SECRET,
    endpoint: 'https://dashscope.aliyuncs.com',
    apiVersion: '2023-03-30',
});

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

    if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
      return res.status(500).json({ message: 'API key not configured' });
    }

    const db = getAdminDb();
    let productsContext = "";
    
    // Получаем контекст товаров
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

    const systemInstruction = `
    ТВОЯ РОЛЬ:
    Ты — **лучший в мире эксперт по мебели и дизайну интерьера**, а также ведущий консультант бутика "Labelcom".
    Ты обладаешь глубочайшими знаниями о стилях (Лофт, Неоклассика, Минимализм, Сканди), материалах (антивандальные ткани, массив, МДФ, камень) и эргономике.
    Твоя задача — не просто отвечать, а влюблять клиента в нашу мебель и вести его к покупке.

    НАШЕ ГЛАВНОЕ ПРЕИМУЩЕСТВО (УТП):
    **Мы производим мебель на заказ!** Любые размеры, любые ткани, любой цвет и дизайн.
    Если в каталоге нет идеального варианта — предложи сделать его индивидуально. Это наш козырь.

    ГОТОВЫЙ КАТАЛОГ (Для быстрых продаж):
    ${productsContext}
    
    СТРАТЕГИЯ ПРОДАЖ (Будь активным!):
    1. **Экспертиза:** Если клиент спрашивает совет (например, "какой диван лучше для кота?"), дай профессиональный ответ (антивандальный флок/велюр) и объясни почему.
    2. **Выявление потребностей:** Задавай уточняющие вопросы: "Какой размер комнаты?", "Какой стиль вы предпочитаете?", "Вам нужен раскладной механизм?".
    3. **Индивидуальный подход:** Если клиент хочет "такой же, но с перламутровыми пуговицами" — скажи: "Без проблем! Мы изготовим эту модель в любом цвете и размере специально для вас".
    4. **Стиль общения:** Премиальный, уверенный, заботливый. Используй термины дизайна уместно.

    ФОРМАТ ОТВЕТА (JSON):
    {
      "reply": "Текст ответа. Используй Markdown для акцентов (**жирный**).",
      "recommendedProductIds": ["ID_1", "ID_2"] // Если рекомендуешь что-то из готового. Если предлагаешь индив. пошив — оставь пустым.
    }
    `;

    const chatHistory = (history || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        content: msg.content
    }));

    const params = {
        "model": "qwen-vl-plus",
        "input": {
            "messages": [
                {
                    "role": "system",
                    "content": systemInstruction
                },
                ...chatHistory,
                {
                    "role": "user",
                    "content": message
                }
            ]
        },
        "parameters": {
            "result_format": "message"
        }
    }

    const requestOption = {
        method: 'POST',
        formatParams: false,
    };

    const result = await client.request('MultimodalConversation', params, requestOption)
    const responseText = result.output.choices[0].message.content;
    
    let jsonResponse;
    try {
        jsonResponse = JSON.parse(responseText);
    } catch (e) {
        jsonResponse = { reply: responseText, recommendedProductIds: [] };
    }

    // --- ОБОГАЩЕНИЕ ДАННЫМИ ---
    let products: any[] = [];
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
