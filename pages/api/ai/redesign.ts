
import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { imageBase64, style } = req.body;

    if (!imageBase64 || !style) {
      return res.status(400).json({ message: 'Image and style are required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
        },
    };

    console.log(`🧠 AI-Консультант анализирует интерьер (Стиль: ${style})...`);

    const prompt = `
    Ты — ведущий дизайнер интерьера и эксперт по продажам премиальной мебели бутика "Labelcom".
    Твоя цель: влюбить клиента в идею преображения его комнаты в стиле "${style}" и убедить, что мебель Labelcom — это лучшее решение.

    Веди себя как дорогой, уверенный в себе консультант. Используй эмоциональные эпитеты ("роскошный", "безупречный", "акцентный").
    Не просто перечисляй факты, а продавай атмосферу.

    Твоя задача:
    1.  **Экспертный анализ:** Оцени текущее фото. Найди сильные стороны (свет, пространство) и точки роста.
    2.  **Видение:** Опиши, как эта комната засияет в стиле "${style}".
    3.  **Конкретные шаги (Action Plan):** Дай 3 мощных совета по изменению интерьера.
    4.  **Подбор мебели (Upsell):** Предложи конкретные типы мебели, которые *необходимо* купить в Labelcom, чтобы завершить образ (Диваны, Кресла, Столы, Кровати, Зеркала). Опиши их так, чтобы захотелось купить немедленно.
    5.  **Палитра:** 4 цвета, которые создадут нужный вайб.

    Ответь ТОЛЬКО в формате JSON:
    {
      "analysis": "Эмоциональный и профессиональный анализ текущей ситуации.",
      "vision": "Вдохновляющее описание будущего интерьера в стиле ${style}.",
      "tips": [
        "Совет 1 (конкретный и стильный)",
        "Совет 2",
        "Совет 3"
      ],
      "palette": ["#Hex1", "#Hex2", "#Hex3", "#Hex4"],
      "suggested_furniture": [
        { "category": "Диваны", "reason": "Для создания центра притяжения в гостиной..." },
        { "category": "Столы", "reason": "Изящный акцент, объединяющий пространство..." },
        { "category": "Зеркала", "reason": "Чтобы добавить воздуха и игры света..." }
      ]
    }
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    
    // Надежный поиск JSON в ответе
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
        console.error("RAW AI RESPONSE (No JSON found):", text);
        throw new Error("Извините, я задумался. Попробуйте спросить еще раз."); 
    }

    let data;
    try {
        data = JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error("JSON PARSE ERROR:", e);
        console.error("RAW JSON STRING:", jsonMatch[0]);
        throw new Error("Ошибка обработки ответа AI. Попробуйте еще раз.");
    }

    console.log("✅ Консультация готова!");

    res.status(200).json({ 
      isConsultation: true,
      data: data
    });

  } catch (error: any) {
    console.error("AI Consultant Error:", error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
