
import { GoogleGenerativeAI } from "@google/generative-ai";
import { HfInference } from "@huggingface/inference";
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import https from 'https';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sleep = promisify(setTimeout);

// --- КОНФИГУРАЦИЯ ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;
const SERVICE_ACCOUNT_PATH = './service-account-key.json'; 
const BATCH_SIZE = 1; 
const DELAY_BETWEEN_ITEMS = 15000; 

if (!GEMINI_API_KEY || !HF_TOKEN) {
    console.error('❌ ОШИБКА: Проверьте GEMINI_API_KEY и HF_TOKEN в .env.local');
    process.exit(1);
}

// Инициализация AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const hf = new HfInference(HF_TOKEN);

// Инициализация Firebase Admin
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
        
        // --- ИСПРАВЛЕНИЕ: ПРАВИЛЬНОЕ ИМЯ БАКЕТА ---
        const bucketName = `${serviceAccount.project_id}.firebasestorage.app`;
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: bucketName
        });
        console.log(`✅ Firebase Admin инициализирован (Бакет: ${bucketName})`);
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error.message);
        process.exit(1);
    }
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

async function fetchImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch image, status code: ${res.statusCode}`));
                return;
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
            res.on('error', (err) => reject(err));
        });
    });
}

async function describeImageWithGemini(imageBuffer, mimeType = "image/jpeg") {
    const modelName = "gemini-2.5-flash"; 
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = "Describe this furniture piece in extreme detail. Focus on material, color, texture, shape, legs, and style. Output ONLY the physical description, comma separated. Do not include background details.";
        const imagePart = {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType,
            },
        };
        const result = await model.generateContent([prompt, imagePart]);
        return result.response.text().trim();
    } catch (error) {
         console.error(`⚠️ Ошибка Gemini:`, error.message);
         throw error;
    }
}

async function generateImageWithHF(description) {
    const prompt = `Professional product photography of a ${description}, placed in a modern, cozy, sunlit living room with plants, high resolution, 8k, photorealistic, interior design magazine style.`;
    const negativePrompt = "blurry, low quality, distorted, watermark, text, bad anatomy, ugly, deformed, cartoon, illustration, drawing";

    try {
        const blob = await hf.textToImage({
            model: 'stabilityai/stable-diffusion-xl-base-1.0',
            inputs: prompt,
            parameters: { negative_prompt: negativePrompt }
        });
        return await blob.arrayBuffer();
    } catch (error) {
        console.error("❌ Ошибка Hugging Face:", error.message);
        throw error;
    }
}

async function uploadToStorage(buffer, destination) {
    const file = bucket.file(destination);
    await file.save(Buffer.from(buffer), {
        contentType: 'image/jpeg',
        public: true, 
    });
    return file.publicUrl(); 
}

// --- ГЛАВНЫЙ ЦИКЛ ---

async function processProduct(doc) {
    const product = doc.data();
    console.log(`\n📦 [${doc.id}] Обработка: ${product.name}`);

    if (product.hasAiImage) {
        console.log(`⏩ Пропуск: уже есть AI фото.`);
        return;
    }

    const mainImageUrl = product.imageUrls && product.imageUrls[0];
    if (!mainImageUrl) {
        console.log(`⚠️ Пропуск: нет изображений.`);
        return;
    }

    try {
        console.log(`  ⬇️ Скачивание оригинала...`);
        let imageBuffer;
        try {
            imageBuffer = await fetchImage(mainImageUrl);
        } catch (e) {
            console.log(`  ⚠️ Не удалось скачать картинку: ${e.message}`);
            return;
        }

        console.log(`  🧠 Генерация описания (Gemini)...`);
        const description = await describeImageWithGemini(imageBuffer);
        
        console.log(`  🎨 Генерация фото (SDXL)...`);
        const newImageBuffer = await generateImageWithHF(description);

        const fileName = `ai-generated/${doc.id}_sdxl_${Date.now()}.jpg`;
        console.log(`  ☁️ Загрузка в Storage (${fileName})...`);
        const publicUrl = await uploadToStorage(newImageBuffer, fileName);

        console.log(`  💾 Обновление базы данных...`);
        await db.collection('products').doc(doc.id).update({
            imageUrls: admin.firestore.FieldValue.arrayUnion(publicUrl),
            aiDescription: description,
            hasAiImage: true,
            aiGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Готово!`);

    } catch (error) {
        console.error(`❌ Ошибка обработки товара: ${error.message}`);
    }
}

async function main() {
    console.log('🚀 Запуск массовой генерации контента...');
    
    // Получаем товары, у которых НЕТ поля hasAiImage (или оно false)
    // Чтобы не перебирать уже готовые
    // Firestore не поддерживает != null напрямую, так что просто берем список и фильтруем в коде для надежности,
    // или используем лимит.
    const snapshot = await db.collection('products')
        .limit(50) 
        .get();

    if (snapshot.empty) {
        console.log('Нет товаров для обработки.');
        return;
    }

    console.log(`Проверяю ${snapshot.size} товаров...`);

    let processedCount = 0;
    for (const doc of snapshot.docs) {
        await processProduct(doc);
        processedCount++;
        
        // Добавляем задержку ТОЛЬКО если мы реально что-то генерировали, а не пропустили
        // Но так как логика пропуска внутри функции, задержку ставим всегда для безопасности, если это не последний
        if (processedCount < snapshot.size) {
             // Чтобы не ждать, если товар пропущен, можно было бы вернуть статус из функции, 
             // но для простоты оставим паузу, это безопасно.
            console.log(`⏳ Пауза ${DELAY_BETWEEN_ITEMS / 1000} сек...`);
            await sleep(DELAY_BETWEEN_ITEMS);
        }
    }

    console.log('\n🏁 Обработка завершена.');
}

main();
