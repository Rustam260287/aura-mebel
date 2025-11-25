
import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Используем быструю и умную модель
    
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

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

async function main() {
    console.log('🔍 Ищу товар для теста...');
    
    // Ищем товар с aiDescription
    const snapshot = await db.collection('products')
        .where('hasAiImage', '==', true)
        .limit(1)
        .get();

    if (snapshot.empty) {
        console.log('❌ Нет товаров с обработанными AI данными.');
        return;
    }

    const doc = snapshot.docs[0];
    const product = doc.data();
    
    console.log(`📦 Товар: ${product.name} (${doc.id})`);
    console.log(`📄 Текущее описание:\n${product.description}\n`);
    console.log(`🤖 AI Описание (EN):\n${product.aiDescription}\n`);

    console.log('✨ Генерирую улучшенное описание...');
    
    try {
        const newDescription = await improveDescription(product.description || "", product.aiDescription || "");
        
        console.log('\n==================================================');
        console.log('🆕 НОВОЕ ОПИСАНИЕ (ПРЕДВАРИТЕЛЬНЫЙ ПРОСМОТР):');
        console.log('==================================================\n');
        console.log(newDescription);
        console.log('\n==================================================');

        // Логика удаления картинок (пока только вывод в консоль, так как это тест)
        const imagesToDelete = product.imageUrls.filter(url => 
            url.includes('ai-generated') || url.includes('storage.googleapis.com')
        );
        
        console.log(`\n🗑️ Будет удалено сгенерированных картинок: ${imagesToDelete.length}`);
        imagesToDelete.forEach(url => console.log(`   - ${url}`));

    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
}

main();
