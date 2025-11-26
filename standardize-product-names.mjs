
import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from 'firebase-admin';
import fs from 'fs';
import dotenv from 'dotenv';
import { promisify } from 'util';

dotenv.config({ path: '.env.local' });
const sleep = promisify(setTimeout);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SERVICE_ACCOUNT_PATH = './service-account-key.json'; 

if (!GEMINI_API_KEY) {
    console.error('❌ ОШИБКА: Не найден GEMINI_API_KEY');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error.message);
        process.exit(1);
    }
}

const db = admin.firestore();

async function standardizeName(currentName) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
    Ты — бренд-менеджер люксового мебельного магазина 'Labelcom'. 
    Твоя задача — взять "сырое" название товара и превратить его в элегантный, премиальный заголовок на русском языке.

    ПРАВИЛА:
    1.  Используй "Title Case" (Каждое Слово с Заглавной Буквы).
    2.  Аббревиатуры, как "тв", пиши заглавными: "ТВ".
    3.  Названия моделей или коллекций заключай в кавычки-ёлочки «».
    4.  Сохраняй суть названия, но сделай его более благородным.
    5.  Убери лишние слова, если они не несут ценности.
    6.  Выводи ТОЛЬКО финальное название, без лишних слов.

    ПРИМЕРЫ:
    -   'тв тумба Сэнди' -> 'ТВ Тумба «Сэнди»'
    -   'PRADA' -> 'Диван «Prada»'
    -   'Стол Рим 2' -> 'Стол «Рим 2»'
    -   'Gucci Premium' -> 'Диван «Gucci Premium»'

    ТЕКУЩЕЕ НАЗВАНИЕ: "${currentName}"
    ИСПРАВЛЕННОЕ НАЗВАНИЕ:
    `;

    try {
        const result = await model.generateContent(prompt);
        // Дополнительная очистка от возможных артефактов
        return result.response.text().trim().replace(/['"]+/g, '');
    } catch (e) {
        console.error("  - ⚠️ Ошибка Gemini:", e.message);
        return currentName; // В случае ошибки возвращаем старое имя
    }
}

async function main() {
    console.log('🚀 Запуск стандартизации названий товаров...');
    
    const snapshot = await db.collection('products').get();
    const productsToUpdate = snapshot.docs;

    console.log(`🔍 Найдено ${productsToUpdate.length} товаров для проверки.`);
    
    let count = 0;
    for (const doc of productsToUpdate) {
        const product = doc.data();
        count++;
        
        const currentName = product.name;
        console.log(`\n- [${count}/${productsToUpdate.length}] Обрабатываю "${currentName}"...`);
        
        const newName = await standardizeName(currentName);

        if (newName && newName !== currentName) {
            console.log(`  - ✨ Новое название: "${newName}"`);
            console.log("  - 💾 Сохраняю в базу...");
            await db.collection('products').doc(doc.id).update({
                name: newName
            });
            console.log("  - ✅ Готово!");
        } else {
            console.log("  - ⏩ Пропуск (название уже в порядке или ошибка).");
        }

        await sleep(1500); // Пауза для API
    }

    console.log('\n🏁 Стандартизация названий завершена.');
}

main();
