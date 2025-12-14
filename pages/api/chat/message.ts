
import { NextApiRequest, NextApiResponse } from 'next';
import { askAI } from '../../../lib/ai/core';
import { SearchService } from '../../../lib/services/search.service';
import { Product } from '../../../types';
import { checkRateLimit } from '../../../lib/rate-limit';
import { verifyAdmin } from '../../../lib/auth/admin-check';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  // Security Check
  const isAdmin = await verifyAdmin(req, res as any).catch(() => false);
  if (!isAdmin) {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
      const limitResult = await checkRateLimit(ip, 50, 3600000, 'chat_message'); 
      if (!limitResult.success) {
          return res.status(200).json({ 
              reply: "Вы исчерпали лимит сообщений. Пожалуйста, подождите или свяжитесь с нами.",
              products: [], quickReplies: []
          });
      }
  }

  try {
    const { message, history, imageUrl } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    let searchQuery = message;
    let visionAnalysis = "";

    // --- VISION PASS: Если есть картинка, анализируем её ---
    if (imageUrl) {
        try {
            console.log("Image detected. Running Vision Analysis...");
            const visionResult: any = await askAI({
                key: 'IMAGE_VISION',
                variables: {}, // No variables needed for system prompt, image goes to context
                context: [
                    { 
                        role: "user", 
                        content: [
                            { type: "text", text: "Analyze this image." },
                            { type: "image_url", image_url: { url: imageUrl } }
                        ] 
                    }
                ],
                responseFormat: 'json',
                model: 'gpt-4o'
            });

            if (visionResult) {
                console.log("Vision Analysis:", visionResult);
                // Используем сгенерированный поисковый запрос вместо текста пользователя
                if (visionResult.search_query) {
                    searchQuery = visionResult.search_query;
                }
                // Формируем блок анализа для финального промпта
                visionAnalysis = `
                ВИЗУАЛЬНЫЙ АНАЛИЗ ЗАГРУЖЕННОГО ФОТО:
                - Объект: ${visionResult.detected_item}
                - Стиль: ${visionResult.style}
                - Материалы: ${visionResult.materials?.join(', ')}
                - Цвета: ${visionResult.colors?.join(', ')}
                - Описание: ${visionResult.visual_description}
                `;
            }
        } catch (e) {
            console.error("Vision Analysis Failed:", e);
            // Fallback: continue without vision data
        }
    }

    // --- SEARCH PASS ---
    let candidates: Product[] = [];
    try {
        console.log(`Searching for: "${searchQuery}"`);
        candidates = await SearchService.search({ query: searchQuery, limit: 20 });
    } catch (e) {
        console.error("SearchService failed:", e);
    }

    const productsContext = candidates.length > 0 
        ? candidates.map(p => `ID: ${p.id}; Название: ${p.name}; Категория: ${p.category}; Цена: ${p.price} руб.; Описание: ${(p.description || '').substring(0, 100)}...`).join('\n')
        : "Каталог пуст или ничего не найдено.";

    // --- FINAL PASS ---
    const contextMessages = history.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
    }));

    // Add user message (with image again, so final model sees it too)
    const userContent: any[] = [{ type: "text", text: message }];
    if (imageUrl) userContent.push({ type: "image_url", image_url: { url: imageUrl } });
    contextMessages.push({ role: "user", content: userContent });

    let jsonResponse;
    try {
        jsonResponse = await askAI({
            key: 'CHAT_ASSISTANT',
            variables: { 
                catalog: productsContext,
                vision_analysis: visionAnalysis // Inject vision data
            },
            context: contextMessages,
            responseFormat: 'json',
            model: 'gpt-4o'
        });
    } catch (err) {
        console.error("AI Core Error:", err);
        return res.status(200).json({ reply: "Извините, я сейчас не могу ответить.", products: [], quickReplies: [] });
    }

    let recommendedProducts: Product[] = [];
    if (jsonResponse.recommendedProductIds?.length > 0) {
        recommendedProducts = candidates.filter(p => jsonResponse.recommendedProductIds.includes(p.id));
    }
    
    if (recommendedProducts.length === 0 && candidates.length > 0) {
        // AI didn't pick specific IDs but search found something -> show top 3 search results
        recommendedProducts = candidates.slice(0, 3);
        if (!jsonResponse.reply) jsonResponse.reply = "Я подобрал несколько вариантов, которые могут вам подойти:";
    }

    res.status(200).json({ 
        reply: jsonResponse.reply, 
        products: recommendedProducts, 
        offerCustom: Boolean(jsonResponse.offerCustom), 
        hideCustomCta: Boolean(jsonResponse.hideCustomCta),
        quickReplies: jsonResponse.quickReplies || [] 
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
