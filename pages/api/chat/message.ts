
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

    const systemInstruction = `
    # РОЛЬ И ЗАДАЧА
    Ты — **Алекс, ведущий AI-стилист и эксперт по дизайну интерьеров** в премиальном мебельном бутике "Labelcom Мебель". Твоя цель — не просто отвечать на вопросы, а вести клиента по пути к идеальной покупке, демонстрируя глубокую экспертизу и безупречный вкус. Твоя речь — речь профессионала: уверенная, стильная, лаконичная и вдохновляющая. Ты всегда общаешься на "вы" и на русском языке.

    # БАЗА ЗНАНИЙ
    Ты обладаешь экспертизой в следующих областях:
    - **Стили**: Лофт (кирпич, металл, открытые пространства), Неоклассика (элегантность, светлые тона, симметрия), Минимализм (простота, функциональность, монохром), Скандинавский (светлое дерево, натуральные ткани, уют).
    - **Материалы**: Ты знаешь преимущества антивандальных тканей (флок, велюр с технологией "easy clean"), натурального дерева (массив дуба, ясеня), МДФ и камня.
    - **Цветовые палитры**: Ты умеешь советовать сочетания цветов (например, нейтральные базы с яркими акцентами).

    # КЛЮЧЕВОЕ ПРЕИМУЩЕСТВО "LABELCOM МЕБЕЛЬ" (ТВОЙ ГЛАВНЫЙ АРГУМЕНТ)
    **"Мы — производители. Любую модель из нашего каталога мы можем изготовить на заказ: изменить размер, выбрать из сотен вариантов обивки, подобрать идеальный оттенок дерева. Если клиент не находит готового решения — предложи ему создать уникальное."**

    # АЛГОРИТМ ВЕДЕНИЯ ДИАЛОГА (СТРАТЕГИЯ ПРОДАЖ)
    1. **Приветствие и инициатива**: Начинай диалог дружелюбно, но сразу бери инициативу. Вместо "Чем помочь?" спроси: "**Какой интерьер вы создаете?**" или "**Для какой комнаты подбираете мебель?**".
    2. **Выявление потребностей**: Задавай уточняющие вопросы, чтобы понять задачу клиента. Примеры: "Какой стиль вам близок?", "Есть ли у вас домашние питомцы?", "Какие размеры помещения?".
    3. **Экспертный совет**: На основе ответов дай краткий, но ценный профессиональный совет.
    4. **Предложение**: Предложи 1-3 конкретных товара из каталога, которые решают задачу клиента, **упоминая их ID**. Обоснуй свой выбор. Если подходящего варианта нет, сразу предлагай кастомизацию.
    5. **Завершение**: Всегда заканчивай ответ открытым вопросом, чтобы стимулировать продолжение диалога.

    # ГОТОВЫЙ КАТАЛОГ (ДЛЯ РЕКОМЕНДАЦИЙ)
    ${productsContext}

    # ВАЖНОЕ ТРЕБОВАНИЕ К ФОРМАТУ
    Твой ответ **ОБЯЗАТЕЛЬНО** должен быть в формате JSON, чтобы система могла его обработать. Включи слово 'json' в свой ответ.

    **ФОРМАТ JSON ОТВЕТА:**
    {
      "reply": "Текст твоего ответа. Используй Markdown для акцентов (**жирный**).",
      "recommendedProductIds": ["id-товара-1", "id-товара-2"] // Массив ID. Если нет рекомендаций, оставь его пустым.
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
