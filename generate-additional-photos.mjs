
import { GoogleGenerativeAI } from "@google/generative-ai";
import { HfInference } from "@huggingface/inference";
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import https from 'https';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

// Настройка путей для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- КОНФИГУРАЦИЯ ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;
const SERVICE_ACCOUNT_PATH = './service-account-key.json'; 

if (!GEMINI_API_KEY) {
    console.error('❌ ОШИБКА: Не найден GEMINI_API_KEY в .env.local');
    process.exit(1);
}

if (!HF_TOKEN) {
    console.error('❌ ОШИБКА: Не найден HF_TOKEN в .env.local');
    process.exit(1);
}

// Инициализация AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const hf = new HfInference(HF_TOKEN);

// Инициализация Firebase Admin
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: `${serviceAccount.project_id}.appspot.com`
        });
        console.log('✅ Firebase Admin инициализирован');
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error.message);
        process.exit(1);
    }
}

const db = admin.firestore();

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

async function fetchImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
            res.on('error', (err) => reject(err));
        });
    });
}

// 1. Описание изображения с помощью Gemini
async function describeImageWithGemini(imageBuffer, mimeType = "image/jpeg") {
    const modelName = "gemini-2.5-flash"; 
    
    try {
        console.log(`🤖 Описываю товар (модель ${modelName})...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = "Describe this furniture piece in extreme detail. Focus on material, color, texture, shape, legs, and style. Output ONLY the physical description, comma separated. Do not include background details.";

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType,
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
         console.error(`⚠️ Ошибка с Gemini:`, error.message);
         throw error;
    }
}

// 2. Генерация изображения с помощью Hugging Face
async function generateImageWithHF(description, outputPath) {
    console.log(`🎨 Генерирую изображение через Stable Diffusion XL...`);
    
    const prompt = `Professional product photography of a ${description}, placed in a modern, cozy, sunlit living room with plants, high resolution, 8k, photorealistic, interior design magazine style.`;
    const negativePrompt = "blurry, low quality, distorted, watermark, text, bad anatomy, ugly, deformed, cartoon, illustration, drawing";

    try {
        const blob = await hf.textToImage({
            model: 'stabilityai/stable-diffusion-xl-base-1.0',
            inputs: prompt,
            parameters: {
                negative_prompt: negativePrompt,
            }
        });

        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Изображение сохранено: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error("❌ Ошибка генерации Hugging Face:", error.message);
        if (error.message.includes("Model is too busy")) {
            console.log("⏳ Модель перегружена, попробуйте позже или используйте Pro аккаунт.");
        }
    }
}

// --- ОСНОВНОЙ СКРИПТ ---

async function main() {
    const outputDir = path.join(__dirname, 'generated_images');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const snapshot = await db.collection('products').limit(1).get();
    
    if (snapshot.empty) {
        console.log('Нет товаров в базе.');
        return;
    }

    const doc = snapshot.docs[0];
    const product = doc.data();
    console.log(`📦 Обрабатываем товар: ${product.name} (${doc.id})`);

    const mainImageUrl = product.imageUrls && product.imageUrls[0];
    if (!mainImageUrl) {
        console.log('У товара нет изображений.');
        return;
    }

    try {
        console.log('⬇️ Скачиваем исходное изображение...');
        const imageBuffer = await fetchImage(mainImageUrl);
        
        const description = await describeImageWithGemini(imageBuffer);
        console.log(`📝 Описание готово.`);

        const outputPath = path.join(outputDir, `${doc.id}_sdxl.jpg`);
        await generateImageWithHF(description, outputPath);

    } catch (error) {
        console.error('❌ Произошла ошибка:', error);
    }
}

main();
