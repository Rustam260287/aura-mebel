
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

    // Убираем префикс
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
        },
    };

    console.log(`🧠 Gemini анализирует интерьер для стиля: ${style}...`);

    const prompt = `
    Ты — профессиональный дизайнер интерьера.
    Пользователь загрузил фото своей комнаты и хочет преобразить её в стиле "${style}".
    
    Твоя задача:
    1. Проанализировать текущий интерьер (что на фото).
    2. Дать 3-4 конкретных совета, что изменить, добавить или убрать, чтобы получить стиль "${style}".
    3. Предложить цветовую палитру (3-4 цвета).
    4. Ответь в формате JSON.
    
    JSON структура:
    {
      "analysis": "Краткий анализ текущей комнаты (1-2 предложения)",
      "tips": [
        "Совет 1",
        "Совет 2",
        "Совет 3"
      ],
      "palette": ["#HexCode1", "#HexCode2", "#HexCode3"],
      "suggested_furniture": ["Диван", "Кресло", "Журнальный столик"] (что подойдет сюда)
    }
    
    Отвечай только JSON, без Markdown.
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    
    // Чистим JSON от ```json ... ```
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    console.log("✅ Анализ готов!");

    res.status(200).json({ 
      isConsultation: true, // Флаг для фронтенда, что это не картинка, а советы
      data: data
    });

  } catch (error: any) {
    console.error("AI Consultant Error:", error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
