
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { message, history } = req.body; // history - previous messages for context

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'OpenAI API key not configured' });
    }

    // 1. Fetch Products Context
    const db = getAdminDb();
    let productsContext = "";
    
    if (db) {
        const snapshot = await db.collection('products').select('name', 'category', 'price', 'description').limit(50).get(); // Limit context for speed/cost if needed, or get all
        // For 60kb file, we can probably get all. But Firestore reads cost money.
        // Let's assume we fetch all active products.
        const products = snapshot.docs.map(doc => {
            const d = doc.data();
            return `ID: ${doc.id}, Name: ${d.name}, Category: ${d.category}, Price: ${d.price}, Desc: ${d.description ? d.description.substring(0, 100) : ''}...`;
        }).join('\n');
        productsContext = products;
    }

    const openai = new OpenAI({ apiKey });

    // 2. Construct Messages
    const systemMessage = `You are an expert interior design consultant and sales assistant for "Labelcom Мебель".
    Your goal is to help customers find the perfect furniture from our catalog.
    
    CATALOG CONTEXT:
    ${productsContext}
    
    INSTRUCTIONS:
    - Be polite, professional, and helpful.
    - Recommend specific products from the catalog based on user needs.
    - If the user asks about design, give advice and suggest matching products.
    - Always answer in Russian.
    - Keep answers concise (2-3 paragraphs max).
    - If you recommend a product, mention its Name and Price.
    - If the catalog is empty or you can't find a match, suggest browsing the "Каталог" page generally.
    `;

    // Convert frontend history to OpenAI format
    const conversation = [
        { role: "system", content: systemMessage },
        ...(history || []).map((msg: any) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: conversation as any,
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content;

    res.status(200).json({ reply });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
