 
import { GoogleGenerativeAI } from "@google/generative-ai";
import admin from 'firebase-admin';
import fs from 'fs';
import https from 'https';
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

async function fetchImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to fetch image with status code ${res.statusCode}`));
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
            res.on('error', (err) => reject(err));
        });
    });
}

async function generateDescriptionFromImage(productName, imageUrl) {
    let imageBuffer;
    try {
        imageBuffer = await fetchImage(imageUrl);
    } catch (e) {
        console.error(`  - ⚠️ Не удалось скачать фото ${imageUrl}: ${e.message}`);
        return null;
    }
    
    const imagePart = {
        inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: "image/jpeg",
        },
    };

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
    Ты — элитный копирайтер мебельного магазина "Aura".
    Твоя задача — написать идеальное описание для товара с названием "${productName}", основываясь ИСКЛЮЧИТЕЛЬНО на предоставленном изображении.

    ТРЕБОВАНИЯ:
    1.  Внимательно изучи изображение.
    2.  Напиши развернутое художественное описание на 3-4 абзаца. Опиши стиль (например, современная классика, лофт, минимализм), материалы, которые ты видишь (например, велюр, глянцевая столешница, резные деревянные ножки, металлические акценты), цвета и общую атмосферу, которую создает мебель.
    3.  После художественной части, добавь заголовок "Техническая информация:".
    4.  Под этим заголовком создай список характеристик, которые можно определить по фото. Например:
        *   **Тип:** Обеденная группа / Диван / Спальный гарнитур
        *   **Материал:** Массив дерева, МДФ, велюр, металл
        *   **Цвет:** Светло-серый, золотой, белый
        *   **Особенности:** Ромбовидная стежка, резные ножки, стеклянные вставки.
    5.  Весь текст должен быть на русском языке и готов к публикации.
    `;

    try {
        const result = await model.generateContent([prompt, imagePart]);
        return result.response.text().trim();
    } catch (e) {
        console.error("  - ⚠️ Ошибка Gemini:", e.message);
        return null;
    }
}

async function main() {
    console.log('🚀 Запуск финальной коррекции всех описаний по фото...');
    
    const snapshot = await db.collection('products').get();
    const productsToProcess = snapshot.docs;

    console.log(`🔍 Найдено ${productsToProcess.length} товаров в базе для исправления.`);
    
    let count = 0;
    for (const doc of productsToProcess) {
        const product = doc.data();
        count++;
        console.log(`\n- [${count}/${productsToProcess.length}] Исправляю "${product.name}" (ID: ${doc.id})...`);

        if (!product.imageUrls || product.imageUrls.length === 0) {
            console.log("  - ⏩ Пропуск: нет изображений.");
            continue;
        }

        const mainImageUrl = product.imageUrls[0];

        console.log("  - ✨ Генерирую новое описание по фото...");
        const newDescription = await generateDescriptionFromImage(product.name, mainImageUrl);
        
        if (!newDescription) {
            console.log("  - ⏩ Пропуск: не удалось сгенерировать описание.");
            continue;
        }

        console.log("  - 💾 Сохраняю в базу...");
        await db.collection('products').doc(doc.id).update({
            description: newDescription
        });
        
        console.log("  - ✅ Готово!");

        await sleep(2000); // Пауза
    }

    console.log('\n🏁 Финальная коррекция завершена.');
}

main();
