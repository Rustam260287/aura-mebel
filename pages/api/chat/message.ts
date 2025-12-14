
import { NextApiRequest, NextApiResponse } from 'next';
import { askAI } from '../../../lib/ai/core';
import { SearchService } from '../../../lib/services/search.service';
import { detectIntent } from '../../../lib/ai/agents/orchestrator';
import { Product } from '../../../types';
import { checkRateLimit } from '../../../lib/rate-limit';
import { checkIsAdmin } from '../../../lib/auth/admin-check';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  // 1. Security Check (Silent)
  const isAdmin = await checkIsAdmin(req);
  
  if (!isAdmin) {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
      const limitResult = await checkRateLimit(ip, 50, 3600000, 'chat_message'); 
      if (!limitResult.success) {
          return res.status(200).json({ reply: "Лимит сообщений исчерпан. Пожалуйста, свяжитесь с нами по телефону." });
      }
  }

  try {
    const { message, history, imageUrl } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    // 2. Vision Pass (if image exists)
    let visionAnalysis = "";
    let searchQuery = message;

    if (imageUrl) {
        try {
            const visionResult: any = await askAI({
                key: 'IMAGE_VISION',
                variables: {},
                context: [{ role: "user", content: [{ type: "text", text: "Analyze this image" }, { type: "image_url", image_url: { url: imageUrl } }] }],
                responseFormat: 'json',
                model: 'gpt-4o'
            });
            if (visionResult) {
                searchQuery = visionResult.search_query || message;
                visionAnalysis = `ВИЗУАЛЬНЫЙ АНАЛИЗ ФОТО: ${visionResult.detected_item}, Стиль: ${visionResult.style}, Материалы: ${visionResult.materials?.join(', ')}`;
            }
        } catch (e) {
            console.error("Vision failed", e);
        }
    }

    // 3. Orchestrator Pass (Detect Intent)
    const intent = await detectIntent(message);
    console.log(`[Label AI] Intent detected: ${intent}`);

    // 4. Execution
    let promptKey: any = 'AGENT_CATALOG'; // Default
    let contextVariables: any = { vision_analysis: visionAnalysis, catalog: "", product_context: "Нет активного товара" };
    let products: Product[] = [];

    // --- LOGIC BRANCHING ---
    if (intent === 'CATALOG' || intent === 'GENERAL') {
        // Search products
        products = await SearchService.search({ query: searchQuery, limit: 15 });
        contextVariables.catalog = products.length > 0 
            ? products.map(p => `ID: ${p.id}; ${p.name}; ${p.price} руб.; ${p.category}`).join('\n')
            : "Ничего не найдено.";
        promptKey = 'AGENT_CATALOG';
    } 
    else if (intent === 'DESIGN') {
        promptKey = 'AGENT_DESIGN';
    } 
    else if (intent === 'TECH') {
        promptKey = 'AGENT_TECH';
    }

    // 5. Final Generation
    const contextMessages = history.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
    }));
    contextMessages.push({ role: "user", content: message });

    const response: any = await askAI({
        key: promptKey,
        variables: contextVariables,
        context: contextMessages,
        responseFormat: 'json',
        model: 'gpt-4o'
    });

    // 6. Response Processing
    let recommendedProducts: Product[] = [];
    if (response.recommendedProductIds?.length > 0) {
        if (products.length > 0) {
            recommendedProducts = products.filter(p => response.recommendedProductIds.includes(p.id));
        }
    } 
    
    if ((intent === 'CATALOG' || intent === 'GENERAL') && recommendedProducts.length === 0 && products.length > 0) {
        recommendedProducts = products.slice(0, 3);
    }

    res.status(200).json({ 
        reply: response.reply, 
        products: recommendedProducts, 
        offerCustom: Boolean(response.offerCustom),
        intent 
    });

  } catch (error: any) {
    console.error("Label AI Error:", error);
    res.status(500).json({ message: "AI Error" });
  }
}
