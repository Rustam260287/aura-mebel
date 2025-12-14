
import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
const bucket = admin.storage().bucket();

async function improveDescription(originalDesc, aiDescEn) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
    Ты - профессиональный копирайтер для мебельного бутика.
    Твоя задача: объединить текущее описание товара (на русском) и детали из AI-анализа изображения (на английском), чтобы создать идеальную карточку товара.

    ВХОДНЫЕ ДАННЫЕ:
    1. Текущее описание: "${originalDesc}"
    2. AI-детали (переведи и используй): "${aiDescEn}"

    ТРЕБОВАНИЯ:
    1. Напиши "вкусный", продающий текст на русском языке (2-3 абзаца). Опиши стиль, материалы, ощущения, цвет.
    2. Сохрани ВСЕ технические данные (размеры, комплектация) из текущего описания.
    3. Не придумывай того, чего нет в исходных данных.
    4. Формат вывода строго такой:
       
       [Здесь художественное описание]

       Техническая информация:
       [Здесь список размеров и характеристик, каждый с новой строки]

    Текст должен быть готов к публикации на сайте.
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (e) {
        console.error("Ошибка Gemini:", e.message);
        return originalDesc; // Возвращаем старое, если ошибка
    }
}

async function processProduct(doc) {
    const product = doc.data();
    console.log(`\n📦 [${doc.id}] Обработка: ${product.name}`);

    // 1. Очистка картинок
    const originalImageCount = product.imageUrls.length;
    const cleanImageUrls = product.imageUrls.filter(url => 
        !url.includes('ai-generated') && !url.includes('storage.googleapis.com')
    );
    const imagesToDelete = product.imageUrls.filter(url => 
        url.includes('ai-generated') || url.includes('storage.googleapis.com')
    );

    if (cleanImageUrls.length !== originalImageCount) {
        console.log(`  🗑️ Удаление ${imagesToDelete.length} AI-картинок...`);
        
        // Удаляем файлы из Storage
        for (const url of imagesToDelete) {
            try {
                // Извлекаем путь из URL
                // URL вида: https://storage.googleapis.com/.../ai-generated%2Ffile.jpg
                // или https://firebasestorage.googleapis.com/.../o/ai-generated%2Ffile.jpg?alt=...
                
                let filePath;
                if (url.includes('%2F')) {
                    const parts = url.split('%2F');
                    const fileName = parts[parts.length - 1].split('?')[0]; // Убираем параметры
                    filePath = `ai-generated/${fileName}`;
                } else {
                     // fallback
                    filePath = `ai-generated/${url.split('/').pop()}`;
                }
                
                // Для надежности просто берем имя файла, если знаем префикс
                // Но лучше парсить аккуратно. В нашем скрипте генерации мы использовали ai-generated/...
                
                // Пробуем удалить
                try {
                    await bucket.file(filePath).delete();
                } catch(e) {
                    // Игнорируем ошибку, если файл не найден (может уже удален)
                }
            } catch (e) {
                console.log(`    ⚠️ Ошибка удаления файла ${url}: ${e.message}`);
            }
        }
    }

    // 2. Улучшение описания
    let newDescription = product.description;
    if (product.aiDescription) {
        console.log(`  ✨ Улучшение описания...`);
        newDescription = await improveDescription(product.description || "", product.aiDescription);
    }

    // 3. Сохранение
    console.log(`  💾 Сохранение изменений...`);
    await db.collection('products').doc(doc.id).update({
        imageUrls: cleanImageUrls,
        description: newDescription,
        hasAiImage: admin.firestore.FieldValue.delete(), // Убираем флаг
        aiDescription: admin.firestore.FieldValue.delete(), // Убираем сырое описание
        aiGeneratedAt: admin.firestore.FieldValue.delete()
    });
    
    console.log(`✅ Готово!`);
}

async function main() {
    console.log('🚀 Запуск применения улучшений...');
    
    // Берем все товары, которые мы пометили флагом hasAiImage
    const snapshot = await db.collection('products')
        .where('hasAiImage', '==', true)
        .get();

    if (snapshot.empty) {
        console.log('Нет товаров для обработки.');
        return;
    }

    console.log(`Найдено ${snapshot.size} товаров. Начало работы...`);

    for (const doc of snapshot.docs) {
        await processProduct(doc);
        // Небольшая пауза для Gemini API
        await sleep(2000); 
    }

    console.log('\n🏁 Все товары обновлены.');
}

main();
