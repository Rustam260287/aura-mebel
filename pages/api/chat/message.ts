
import { NextApiRequest, NextApiResponse } from 'next';
import { askAI } from '../../../lib/ai/core';
import { SearchService } from '../../../lib/services/search.service';
import { Product } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { message, history, imageUrl } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    // 1. Поиск товаров через единый сервис (RAG)
    // Теперь вся сложность (векторы, теги, размеры) спрятана внутри SearchService
    let candidates: Product[] = [];
    try {
        candidates = await SearchService.search({ query: message, limit: 20 });
    } catch (e) {
        console.error("SearchService failed:", e);
        // Fallback: empty list, AI will handle generic response
    }

    // 2. Формируем контекст для AI
    const productsContext = candidates.length > 0 
        ? candidates.map(p => `ID: ${p.id}; Название: ${p.name}; Категория: ${p.category}; Цена: ${p.price} руб.`).join('\n')
        : "Каталог пуст или ничего не найдено.";

    // 3. Формируем историю сообщений
    const contextMessages = history.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
    }));

    const userContent: any[] = [{ type: "text", text: message }];
    if (imageUrl) {
        userContent.push({ type: "image_url", image_url: { url: imageUrl } });
    }
    contextMessages.push({ role: "user", content: userContent });

    // 4. Запрос к AI (используем реестр промптов)
    let jsonResponse;
    try {
        jsonResponse = await askAI({
            key: 'CHAT_ASSISTANT',
            variables: { catalog: productsContext },
            context: contextMessages,
            responseFormat: 'json',
            model: 'gpt-4o'
        });
    } catch (err) {
        console.error("AI Core Error:", err);
        return res.status(200).json({
          reply: "Извините, я сейчас не могу ответить. Попробуйте позже.",
          products: [],
          offerCustom: true,
          quickReplies: []
        });
    }

    // 5. Финальная сборка ответа
    // Если AI выбрал ID товаров, находим их полные данные из кандидатов (чтобы не делать лишний запрос в БД)
    let recommendedProducts: Product[] = [];
    if (jsonResponse.recommendedProductIds?.length > 0) {
        recommendedProducts = candidates.filter(p => jsonResponse.recommendedProductIds.includes(p.id));
    }
    
    // Если AI ничего не выбрал, но кандидаты были (fallback)
    if (recommendedProducts.length === 0 && candidates.length > 0) {
        recommendedProducts = candidates.slice(0, 3);
        if (!jsonResponse.reply) jsonResponse.reply = "Вот что я нашел по вашему запросу:";
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
