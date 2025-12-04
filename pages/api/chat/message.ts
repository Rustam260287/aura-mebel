
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import admin from 'firebase-admin';
import { Product } from '../../../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cleanText(text: string): string {
    if (!text) return '';
    return text.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const db = getAdminDb();
    let productsContext = "Каталог пуст.";
    if (db) {
        const snapshot = await db.collection('products').select('name', 'category', 'price', 'description_main').limit(100).get();
        productsContext = snapshot.docs.map(doc => {
            const d = doc.data();
            return `[ID: ${doc.id}] ${d.name} (${d.category}): ${d.price} руб.`;
        }).join('\n');
    }

    // --- НОВЫЙ, БОЛЕЕ СТРОГИЙ ПРОМПТ ---
    const systemInstruction = `
    Ты — AI-стилист мебельного бутика "Labelcom Мебель".
    Твоя задача — консультировать клиентов и помогать им с выбором.
    Каталог товаров: ${productsContext}.
    Твой ответ ВСЕГДА должен быть в формате JSON-объекта, содержащего ключи "reply" и "recommendedProductIds".
    Пример твоего ответа в формате JSON:
    {
      "reply": "Здравствуйте! Чем я могу помочь вам сегодня?",
      "recommendedProductIds": []
    }
    `;
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemInstruction },
        ...history.map((msg: any) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        })),
        { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message.content;
    
    let jsonResponse;
    try {
        if (!responseText) throw new Error("Empty response from OpenAI");
        jsonResponse = JSON.parse(responseText);
    } catch (e) {
        console.error("Could not parse JSON from OpenAI, response was:", responseText);
        jsonResponse = { reply: "Простите, я не смог обработать ваш запрос. Попробуйте переформулировать.", recommendedProductIds: [] };
    }

    let products: (Product | admin.firestore.DocumentData)[] = [];
    if (jsonResponse.recommendedProductIds?.length > 0 && db) {
        try {
            const ids = jsonResponse.recommendedProductIds.slice(0, 5);
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
    console.error("Chat API Error:", error.message);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
