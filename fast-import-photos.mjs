
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// --- КОНФИГУРАЦИЯ ---
const SOURCE_DIR = 'import_photos'; // Папка, куда вы положите фото
const BUCKET_NAME = 'aura-mebel-7ec96.appspot.com';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';
// ---------------------

// Инициализация Firebase
const serviceAccount = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: BUCKET_NAME
});

const db = getFirestore();
const bucket = getStorage().bucket();
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Функция загрузки фото
async function uploadImage(filePath) {
    const fileName = path.basename(filePath);
    const remotePath = `products/${Date.now()}_${fileName}`; // Уникальное имя
    
    console.log(`⬆️ Загружаю ${fileName}...`);
    
    const [file] = await bucket.upload(filePath, {
        destination: remotePath,
        metadata: {
            contentType: 'image/jpeg', // Или автоопределение
            cacheControl: 'public, max-age=31536000',
        },
    });

    // Получаем публичную ссылку (требует, чтобы bucket был public или token)
    // Для простоты используем signed url или стандартный формат firebase storage
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${remotePath}`;
    
    // Альтернативный формат ссылки, который часто используется в Firebase Client SDK
    // const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encodeURIComponent(remotePath)}?alt=media`;

    return publicUrl;
}

// Функция генерации контента через Gemini
async function analyzeImage(imagePath) {
    console.log(`🤖 Анализирую фото через AI...`);
    const imageBuffer = await fs.readFile(imagePath);
    
    const prompt = `
    Посмотри на это изображение мебели.
    Твоя задача — вернуть JSON объект с информацией о товаре.
    Не пиши никакого markdown, только чистый JSON.
    
    Формат JSON:
    {
      "name": "Короткое красивое название товара (3-5 слов)",
      "category": "Категория (например: Диваны, Кровати, Столы, Стулья, Шкафы, Кухни)",
      "price": 0,
      "description": "Художественное описание товара на 2-3 абзаца, продающий текст.",
      "details": {
         "material": "Материал (предположи по фото)",
         "color": "Цвет",
         "style": "Стиль (Лофт, Классика, Модерн и т.д.)"
      }
    }
    Если цену определить невозможно, ставь 0.
    `;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType: "image/jpeg", // Упрощаем, считаем что jpeg/png
            },
        },
    ]);

    const text = result.response.text();
    // Очистка от markdown ```json ... ```
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Ошибка парсинга JSON от AI:", text);
        return {
            name: "Новый товар",
            category: "Разное",
            price: 0,
            description: "Описание будет добавлено позже.",
            details: {}
        };
    }
}

async function main() {
    try {
        // Проверяем папку
        try {
            await fs.access(SOURCE_DIR);
        } catch {
            console.error(`❌ Папка ${SOURCE_DIR} не найдена. Создайте её и положите туда фото.`);
            return;
        }

        const files = await fs.readdir(SOURCE_DIR);
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

        if (imageFiles.length === 0) {
            console.log("📭 В папке import_photos нет изображений.");
            return;
        }

        console.log(`🚀 Найдено ${imageFiles.length} фото. Начинаем импорт...`);

        for (const fileName of imageFiles) {
            const localPath = path.join(SOURCE_DIR, fileName);
            
            try {
                // 1. Анализ фото (параллельно с загрузкой можно, но лучше последовательно для логов)
                const productInfo = await analyzeImage(localPath);
                
                // 2. Загрузка фото
                const publicUrl = await uploadImage(localPath);

                // 3. Сохранение в Firestore
                const docRef = db.collection('products').doc();
                
                const productData = {
                    ...productInfo,
                    imageUrls: [publicUrl],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    rating: 5,
                    reviews: []
                };

                await docRef.set(productData);
                console.log(`✅ Добавлен товар: ${productInfo.name}`);

                // 4. (Опционально) Удаление или перемещение файла
                // await fs.rename(localPath, path.join('imported_photos', fileName));

            } catch (err) {
                console.error(`❌ Ошибка с файлом ${fileName}:`, err);
            }
        }

        console.log("🏁 Импорт завершен!");

    } catch (error) {
        console.error("Global Error:", error);
    }
}

main();
