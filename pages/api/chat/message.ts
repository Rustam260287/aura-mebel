
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import admin from 'firebase-admin';
import { Product } from '../../../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { message, history, imageUrl } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const db = getAdminDb();
    let productsContext = "Каталог пуст.";
    
    if (db) {
        // Берем больше товаров и более длинное описание для "Экспертов"
        const snapshot = await db.collection('products').limit(80).get();
        productsContext = snapshot.docs.map(doc => {
            const d = doc.data();
            let desc = (d.description || d.description_main || '').replace(/\s+/g, ' ').trim();
            if (desc.length > 300) desc = desc.substring(0, 300) + "...";
            
            return `ID: ${doc.id}
Название: ${d.name}
Категория: ${d.category}
Цена: ${d.price} руб.
Детали: ${desc}
---`;
        }).join('\n');
    }

    // --- НОВЫЙ, ПРОДВИНУТЫЙ ПРОМПТ "КОМАНДА ЭКСПЕРТОВ" ---
    const systemInstruction = `
    Ты — "Labelcom Intelligence", виртуальный консилиум лучших экспертов мебельного бутика.
    
    ТВОЯ ВНУТРЕННЯЯ КОМАНДА:
    1. 📐 АРХИТЕКТОР: Анализирует пространство, размеры (из описания товаров), эргономику. Следит, чтобы мебель влезала.
    2. 🎨 ДЕКОРАТОР: Оценивает стиль (Классика, Модерн, Ар-деко), цветовые сочетания, ткани и атмосферу.
    3. 💼 МЕНЕДЖЕР: Знает каталог наизусть, видит "Новинки 2025" (как Борнео), подмечает выгоду и статусность.

    ТВОЯ ЗАДАЧА:
    1. Если есть фото — "Декоратор" анализирует его визуально.
    2. "Архитектор" проверяет, подойдет ли мебель по габаритам (если пользователь их указал или видно по фото).
    3. "Менеджер" находит лучшие товары из КАТАЛОГА НИЖЕ.
    4. ТЫ (как ведущий) синтезируешь их мнения в один дружелюбный, экспертный и продающий ответ.

    КАТАЛОГ ТОВАРОВ:
    ${productsContext}
    
    ПРАВИЛА:
    - Не пиши "Архитектор говорит...", пиши от одного лица, но используй их знания.
    - Используй детали из описания (например, "Этот диван имеет глубину 1 метр, что идеально для отдыха").
    - Если товар "Новинка" — обязательно упомяни это.
    - Предлагай 2-3 варианта.
    
    ФОРМАТ ОТВЕТА (JSON):
    {
      "reply": "Твой синтезированный ответ...",
      "recommendedProductIds": ["ID_1", "ID_2"]
    }
    `;
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemInstruction },
        ...history.map((msg: any) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
        })),
    ];

    let userContent: any = [{ type: "text", text: message }];
    
    if (imageUrl) {
        userContent.push({
            type: "image_url",
            image_url: {
                url: imageUrl,
                detail: "auto"
            }
        });
    }

    messages.push({ role: "user", content: userContent });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: messages,
      response_format: { type: "json_object" },
      max_tokens: 1500, // Увеличили лимит для более развернутого ответа
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;
    
    let jsonResponse;
    try {
        if (!responseText) throw new Error("Empty response");
        jsonResponse = JSON.parse(responseText);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        jsonResponse = { reply: "Произошла ошибка обработки. Пожалуйста, повторите запрос.", recommendedProductIds: [] };
    }

    let products: (Product | admin.firestore.DocumentData)[] = [];
    if (jsonResponse.recommendedProductIds?.length > 0 && db) {
        try {
            const ids = jsonResponse.recommendedProductIds.slice(0, 10).filter((id: string) => id && id.length > 5);
            if (ids.length > 0) {
                const productsSnapshot = await db.collection('products').where(admin.firestore.FieldPath.documentId(), 'in', ids).get();
                products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
        } catch (e) {
            console.error("Error fetching recommended products:", e);
        }
    }

    res.status(200).json({ reply: jsonResponse.reply, products });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ message: 'Ошибка сервера AI' });
  }
}
