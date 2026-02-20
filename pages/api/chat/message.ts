
import { NextApiRequest, NextApiResponse } from 'next';
import { askAI } from '../../../lib/ai/core';
import { checkRateLimit } from '../../../lib/rate-limit';
import { checkIsAdmin } from '../../../lib/auth/admin-check';

const HANDOFF_CONFIRMATION_REPLY =
  'Я не подсказываю по стоимости или покупке.\nЕсли это важно, можно обсудить с куратором.';

function isPricingRequest(input: unknown): boolean {
  const text = typeof input === 'string' ? input : '';
  const t = text.toLowerCase();
  if (!t.trim()) return false;
  return (
    /\bprice\b/.test(t) ||
    /\bcost\b/.test(t) ||
    /сколько\s+стоит/.test(t) ||
    /цена\b/.test(t) ||
    /стоимост/.test(t) ||
    /прайс/.test(t) ||
    /доставк/.test(t) ||
    /скидк/.test(t) ||
    /оплат/.test(t)
  );
}

function isPurchaseRequest(input: unknown): boolean {
  const text = typeof input === 'string' ? input : '';
  const t = text.toLowerCase();
  if (!t.trim()) return false;
  return (
    /как\s+заказат/.test(t) ||
    /заказат/.test(t) ||
    /купит/.test(t) ||
    /покупк/.test(t) ||
    /оформит/.test(t) ||
    /\border\b/.test(t) ||
    /\bbuy\b/.test(t)
  );
}

function containsCommerceContent(input: unknown): boolean {
  const text = typeof input === 'string' ? input : '';
  const t = text.toLowerCase();
  if (!t.trim()) return false;
  return (
    /₽|\$|€/.test(text) ||
    /руб/.test(t) ||
    /usd|eur|rub/.test(t) ||
    /сколько\s+стоит/.test(t) ||
    /цена\b/.test(t) ||
    /стоимост/.test(t) ||
    /прайс/.test(t) ||
    /доставк/.test(t) ||
    /скидк/.test(t) ||
    /оплат/.test(t) ||
    /как\s+заказат/.test(t) ||
    /заказат/.test(t) ||
    /купит/.test(t) ||
    /покупк/.test(t) ||
    /оформит/.test(t) ||
    /\border\b/.test(t) ||
    /\bbuy\b/.test(t)
  );
}

import { setCorsHeaders } from '../../../lib/api/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 1. Security Check (Silent)
    const isAdmin = await checkIsAdmin(req);

    if (!isAdmin) {
      const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.socket.remoteAddress ||
        'unknown';
      const limitResult = await checkRateLimit(ip, 50, 3600000, 'chat_message');
      if (!limitResult.success) {
        return res
          .status(200)
          .json({ reply: 'Лимит сообщений исчерпан. Пожалуйста, свяжитесь с нами по телефону.' });
      }
    }

    const { message, history, imageUrl, objectContext } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    if (isPricingRequest(message) || isPurchaseRequest(message)) {
      return res.status(200).json({ reply: HANDOFF_CONFIRMATION_REPLY, handoffRequired: true });
    }

    // 2. Vision Pass (if image exists)
    let visionAnalysis = "";

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
          visionAnalysis = `ВИЗУАЛЬНЫЙ АНАЛИЗ ФОТО: ${visionResult.detected_item}, Стиль: ${visionResult.style}, Материалы: ${visionResult.materials?.join(', ')}`;
        }
      } catch (e) {
        console.error("Vision failed", e);
      }
    }

    const promptKey: any = 'ASSISTANT_DECISION_SUPPORT';
    const ctx = (objectContext && typeof objectContext === 'object') ? (objectContext as any) : {};
    const objectName = typeof ctx.name === 'string' ? ctx.name : '';
    const objectType = typeof ctx.objectType === 'string' ? ctx.objectType : '';
    const contextVariables: any = { vision_analysis: visionAnalysis, object_name: objectName, object_type: objectType };

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

    const isHandoff = Boolean(response?.handoffRequired) || containsCommerceContent(response?.reply);
    const reply = isHandoff ? HANDOFF_CONFIRMATION_REPLY : response.reply;

    res.status(200).json({
      reply,
      handoffRequired: isHandoff,
    });

  } catch (error: any) {
    console.error("Label AI Error:", error);
    res.status(500).json({ error: "AI Error" });
  }
}
