
import admin from 'firebase-admin';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// --- CONFIG ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });

// Загружаем каталог товаров для контекста
const productsRaw = JSON.parse(fs.readFileSync('all_products.json', 'utf8'));
// Упрощаем каталог для экономии токенов
const catalog = productsRaw.map(p => ({
    name: p.name,
    category: p.category,
    price: p.price,
    description: p.description ? p.description.substring(0, 100) : ''
})).slice(0, 50); // Берем топ-50 товаров

const catalogContext = JSON.stringify(catalog);

const TOPICS = [
    { title: "Тренды 2025", prompt: "Напиши обзорный материал о главных трендах в интерьере на 2025 год. Упомяни натуральные материалы и сложные цвета." },
    { title: "Спальня мечты", prompt: "Как создать идеальную спальню для отдыха. Расскажи про важность кровати и текстиля." },
    { title: "Гид по диванам", prompt: "Как выбрать диван: велюр или кожа? Угловой или прямой? Подробный разбор." },
    { title: "Кухня-Гостиная", prompt: "Зонирование пространства в объединенной кухне-гостиной. Советы дизайнера." },
    { title: "Стиль Лофт", prompt: "Лофт жив? Как адаптировать индустриальный стиль для уютной квартиры." },
    { title: "Освещение", prompt: "Сценарии освещения: как свет меняет атмосферу комнаты." }
];

async function generateImage(topic) {
    const prompt = `interior design photography for blog post about "${topic}", cinematic lighting, 8k, photorealistic, luxury style, magazine cover quality, award winning photography`;
    const seed = Math.floor(Math.random() * 1000000);
    // Используем модель Turbo для скорости и качества
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=800&seed=${seed}&nologo=true&model=flux`;
    return url;
}

async function generateArticle(topicObj) {
    console.log(`✍️ Пишу статью: ${topicObj.title}...`);
    
    const prompt = `
    Ты — главный редактор премиального журнала о дизайне интерьера (уровень Architectural Digest, Elle Decoration).
    Твоя задача — написать статью на тему: "${topicObj.prompt}".
    
    КАТАЛОГ ТОВАРОВ НАШЕГО БУТИКА:
    ${catalogContext}
    
    ИНСТРУКЦИЯ:
    1.  **Стиль:** Изысканный, вдохновляющий, но практичный. Используй термины ("фактура", "эргономика", "сценарии жизни").
    2.  **Структура:** Введение -> 3-4 раздела с подзаголовками -> Заключение.
    3.  **Интеграция товаров (Shoppable Content):** 
        Когда упоминаешь мебель (например, "мягкий диван"), найди ПОХОЖИЙ товар в каталоге выше.
        Вставь после абзаца специальный блок в формате: 
        [PRODUCT: Название товара]
        Сделай это 2-3 раза за статью, где это уместно. Не спамь.
    4.  **Форматирование:** Используй HTML теги: <h2>, <p>, <ul>, <li>, <blockquote> (для цитат).

    JSON ОТВЕТ:
    {
      "title": "Красивый журнальный заголовок",
      "excerpt": "Интригующий лид (вступление) для карточки статьи.",
      "content": "HTML контент статьи...",
      "author": "Labelcom Design",
      "tags": ["Тег 1", "Тег 2"]
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const response = JSON.parse(responseText);
        
        const imageUrl = await generateImage(topicObj.title);
        
        // Поиск реальных ID товаров по названиям, которые предложил AI
        // (Это простая эмуляция, в идеале AI должен возвращать ID, но названия надежнее для поиска тут)
        let relatedProductIds = [];
        
        // Пройдемся по контенту и попробуем найти [PRODUCT: ...]
        // Но проще попросить AI вернуть список recommended_products отдельно в JSON, 
        // но для вставки в текст [PRODUCT: ...] нам нужно потом заменить это на компонент.
        // Пока оставим [PRODUCT: Name] в тексте, а на фронтенде будем парсить.
        
        return {
            ...response,
            imageUrl,
            createdAt: new Date().toISOString(),
            status: 'published'
        };
    } catch (e) {
        console.error("Gemini Error:", e);
        throw e;
    }
}

async function main() {
    console.log("🚀 Генерация Shoppable Content...");
    
    // Удаляем старые
    const snapshot = await db.collection('blog').get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log("🗑️ База очищена.");

    for (const topic of TOPICS) {
        try {
            const article = await generateArticle(topic);
            await db.collection('blog').add(article);
            console.log(`✅ [${article.title}] готово.`);
        } catch (e) {
            console.error(`❌ Ошибка с темой "${topic.title}":`, e);
        }
    }
    
    console.log("🏁 Все статьи опубликованы.");
}

main();
