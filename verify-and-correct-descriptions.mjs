
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

async function generateVerboseDescription(correctRawDesc) {
    if (!correctRawDesc || correctRawDesc.length < 20) {
        console.log("  - ⚠️  Сырое описание слишком короткое, пропуск генерации.");
        return correctRawDesc; // Возвращаем как есть
    }
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
        [Здесь четкий список всех характеристик: размеры, материалы, комплектация и т.д.]

    Текст должен быть полностью готов к публикации на сайте. Не пиши ничего, кроме результата в указанном формате.
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (e) {
        console.error("  - ⚠️ Ошибка Gemini:", e.message);
        return correctRawDesc; // В случае ошибки возвращаем исходный текст
    }
}

async function main() {
    console.log('🚀 Запуск сверки и исправления описаний (v2)...');
    
    // 1. Загружаем "источник правды" - JSON файл
    const rawData = fs.readFileSync('all_products_full.json', 'utf8');
    const allProductsJson = JSON.parse(rawData);
    
    // Преобразуем в Map для быстрого поиска по originalUrl
    const truthSource = new Map();
    allProductsJson.forEach(p => {
        if (p.originalUrl) {
            truthSource.set(p.originalUrl, p);
        }
    });
    console.log(`📂 Загружен "источник правды": ${truthSource.size} уникальных товаров из JSON.`);

    // 2. Получаем все товары из Firestore
    const snapshot = await db.collection('products').get();
    const productsToProcess = snapshot.docs;
    console.log(`🔍 Найдено ${productsToProcess.length} товаров в базе для проверки.`);
    
    let count = 0;
    for (const doc of productsToProcess) {
        const product = doc.data();
        count++;
        console.log(`\n- [${count}/${productsToProcess.length}] Проверяю "${product.name}"...`);

        if (!product.originalUrl) {
            console.log("  - ⏩ Пропуск: нет originalUrl в базе.");
            continue;
        }

        // 3. Ищем эталонные данные в нашем Map
        const correctProductData = truthSource.get(product.originalUrl);

        if (!correctProductData) {
            console.log(`  - ⚠️ Не найден эталон для URL: ${product.originalUrl}`);
            continue;
        }

        // 4. Генерируем новое описание на основе ЭТАЛОННОГО сырого текста
        console.log("  - ✨ Генерирую новое описание на основе эталона...");
        const newDescription = await generateVerboseDescription(correctProductData.description);
        
        if (!newDescription) {
            console.log("  - ⏩ Пропуск: не удалось сгенерировать описание.");
            continue;
        }

        // 5. Обновляем в базе
        console.log("  - 💾 Сохраняю в базу...");
        await db.collection('products').doc(doc.id).update({
            description: newDescription,
            // Заодно можем поправить имя и цену, если они "уехали"
            name: correctProductData.name,
            price: correctProductData.price
        });
        
        console.log("  - ✅ Готово!");

        await sleep(2000); // Пауза для API
    }

    console.log('\n🏁 Проверка и исправление завершены.');
}

main();
