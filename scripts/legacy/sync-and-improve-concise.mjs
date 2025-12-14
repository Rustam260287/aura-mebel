
import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import https from 'https';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
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

// --- ФУНКЦИИ ---

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

async function generateConciseDescription(originalDesc, imageUrl) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    let imagePart = null;
    if (imageUrl) {
        try {
            const buffer = await fetchImage(imageUrl);
            imagePart = {
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: "image/jpeg",
                },
            };
        } catch (e) {
            console.log(`⚠️ Не удалось скачать фото для анализа: ${e.message}`);
        }
    }

    const prompt = `
    Ты - редактор каталога мебели. 
    Твоя задача: написать ЛАКОНИЧНОЕ и информативное описание товара на русском языке.

    ВХОДНЫЕ ДАННЫЕ:
    Текст: "${originalDesc}"
    (Также используй изображение для определения цвета/стиля, если есть)

    ТРЕБОВАНИЯ:
    1. Напиши ОДИН абзац (2-3 предложения) о стиле, назначении и материалах. Без лишней "воды" и восхищений ("непревзойденный", "потрясающий" - убрать).
    2. Затем напиши "Характеристики:" и перечисли размеры и материалы списком.
    3. Стиль: деловой, дружелюбный, минималистичный.
    `;

    try {
        const parts = [prompt];
        if (imagePart) parts.push(imagePart);
        
        const result = await model.generateContent(parts);
        return result.response.text().trim();
    } catch (e) {
        console.error("Ошибка Gemini:", e.message);
        return originalDesc; 
    }
}

async function main() {
    console.log('🚀 Синхронизация товаров с лаконичными описаниями...');
    
    const rawData = fs.readFileSync('all_products_full.json', 'utf8');
    const allProducts = JSON.parse(rawData);
    
    console.log(`📂 Загружено ${allProducts.length} товаров из JSON.`);

    // Получаем текущие товары из БД, чтобы не дублировать
    const snapshot = await db.collection('products').get();
    const existingProducts = new Map();
    snapshot.forEach(doc => {
        existingProducts.set(doc.data().name, doc); // Ключ - имя
    });

    console.log(`🗄️ В базе уже есть ${existingProducts.size} товаров.`);

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const product of allProducts) {
        const existingDoc = existingProducts.get(product.name);
        
        // 1. ТОВАР УЖЕ ЕСТЬ
        if (existingDoc) {
            const data = existingDoc.data();
            
            // Проверяем, нужно ли улучшать описание
            // Если описание содержит "Описание\n" (признак сырого парсинга) или очень короткое
            const needsImprovement = data.description && (data.description.includes('Описание\n') || data.description.length < 50);
            
            if (needsImprovement) {
                console.log(`🔄 [${product.name}] Обновление описания (было сырое)...`);
                const newDesc = await generateConciseDescription(product.description, product.imageUrls[0]);
                
                await db.collection('products').doc(existingDoc.id).update({
                    description: newDesc,
                    price: product.price // обновляем и цену заодно
                });
                updated++;
                await sleep(1500); // Пауза для API
            } else {
                 // Просто обновляем цену/категорию, если надо
                 if (data.price !== product.price) {
                     console.log(`💰 [${product.name}] Обновление цены: ${data.price} -> ${product.price}`);
                     await db.collection('products').doc(existingDoc.id).update({ price: product.price });
                     updated++;
                 } else {
                     // console.log(`⏩ [${product.name}] Пропуск (актуален).`);
                     skipped++;
                 }
            }
        } 
        // 2. НОВЫЙ ТОВАР
        else {
            console.log(`✨ [${product.name}] Новый товар! Генерирую описание...`);
            
            const newDesc = await generateConciseDescription(product.description, product.imageUrls[0]);
            
            const newProductData = {
                ...product,
                description: newDesc,
                rating: 0,
                reviews: [],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('products').add(newProductData);
            added++;
            await sleep(1500); // Пауза
        }
    }

    console.log('\n🏁 Синхронизация завершена.');
    console.log(`➕ Добавлено: ${added}`);
    console.log(`🔄 Обновлено: ${updated}`);
    console.log(`⏩ Пропущено: ${skipped}`);
}

main();
