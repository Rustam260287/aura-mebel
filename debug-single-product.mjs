
import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from 'firebase-admin';
import fs from 'fs';
import * as cheerio from 'cheerio';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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
        const bucketName = `${serviceAccount.project_id}.firebasestorage.app`;
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: bucketName
        });
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error.message);
        process.exit(1);
    }
}

const db = admin.firestore();

async function fetchPage(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error(`  - ⚠️ Не удалось скачать страницу ${url}:`, error.message);
        return null;
    }
}

async function reparseCorrectDescription(url) {
    const html = await fetchPage(url);
    if (!html) return null;
    const $ = cheerio.load(html);
    return $('.product-description').text().trim();
}

async function generateVerboseDescription(correctRawDesc) {
    if (!correctRawDesc) return "Описание не найдено."; // Fallback
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
    Ты - элитный копирайтер для премиального мебельного магазина "Aura".
    Твоя задача: взять сырое описание товара и превратить его в развернутый, вдохновляющий и продающий текст на русском.

    ВХОДНЫЕ ДАННЫЕ:
    "${correctRawDesc}"

    ТРЕБОВАНИЯ:
    1.  Напиши развернутое художественное описание на 3-4 абзаца. Расскажи о стиле, атмосфере, которую создает мебель, материалах и дизайне. Используй богатый язык.
    2.  Сохрани ВСЕ технические данные (размеры, комплектация, материалы).
    3.  Структурируй вывод СТРОГО в следующем формате:
        
        [Здесь 3-4 абзаца художественного описания]
        
        Техническая информация:
        [Здесь четкий список всех характеристик]

    Текст должен быть полностью готов к публикации на сайте.
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (e) {
        console.error("  - ⚠️ Ошибка Gemini:", e.message);
        return correctRawDesc;
    }
}

async function main() {
    const productName = "Стол Рим 2";
    console.log(`🎯 Ищу и исправляю "${productName}"...`);
    
    const snapshot = await db.collection('products').where('name', '==', productName).get();

    if (snapshot.empty) {
        console.log(`❌ Товар "${productName}" не найден в базе.`);
        return;
    }

    for (const doc of snapshot.docs) {
        const product = doc.data();
        console.log(`  - Найден документ ${doc.id}`);

        if (!product.originalUrl) {
            console.log("    - ⏩ Пропуск: нет originalUrl.");
            continue;
        }

        console.log("    - 🌐 Скачиваю эталонное описание...");
        const correctRawDesc = await reparseCorrectDescription(product.originalUrl);
        if (!correctRawDesc) {
            console.log("    - ⏩ Пропуск: не удалось получить описание.");
            continue;
        }

        console.log("    - ✨ Генерирую новое описание...");
        const newDescription = await generateVerboseDescription(correctRawDesc);
        
        console.log("    - 💾 Сохраняю в базу...");
        await db.collection('products').doc(doc.id).update({
            description: newDescription
        });
        
        console.log("    - ✅ Готово!");
    }

    console.log('\n🏁 Исправление завершено.');
}

main();
