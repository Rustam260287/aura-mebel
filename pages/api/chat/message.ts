
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import admin from 'firebase-admin';
import { Product } from '../../../types'; // Импортируем тип Product

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
    let productsContext = "";
    if (db) {
        const snapshot = await db.collection('products').select('name', 'category', 'price', 'description_main').limit(100).get();
        productsContext = snapshot.docs.map(doc => {
            const d = doc.data();
            return `[ID: ${doc.id}] ${d.name} (${d.category}): ${d.price} руб. ${cleanText(d.description_main || '').substring(0, 100)}...`;
        }).join('\n');
    }

    const systemInstruction = `ТВОЯ РОЛЬ: Ты — **лучший в мире эксперт по мебели и дизайну интерьера**, консультант бутика "Aura Mebel". Твоя задача — влюблять клиента в нашу мебель. Отвечай всегда на русском языке... (и так далее)`;
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemInstruction },
        ...history.map((msg: any) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
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

    let products: Product[] = []; // Явно указываем тип
    if (jsonResponse.recommendedProductIds?.length > 0 && db) {
        try {
            const ids = jsonResponse.recommendedProductIds.slice(0, 10);
            if (ids.length > 0) {
                const productsSnapshot = await db.collection('products').where(admin.firestore.FieldPath.documentId(), 'in', ids).get();
                products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
            }
        } catch (e) {
            console.error("Error fetching recommended products:", e);
        }
    }

    res.status(200).json({ reply: jsonResponse.reply, products });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
