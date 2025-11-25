
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

async function generateVerboseDescription(originalDesc) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
    Ты - элитный копирайтер для премиального мебельного магазина "Aura".
    Твоя задача: взять сырое описание товара и превратить его в развернутый, вдохновляющий и продающий текст на русском.

    ВХОДНЫЕ ДАННЫЕ:
    "${originalDesc}"

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
        console.error("Ошибка Gemini:", e.message);
        return originalDesc; // В случае ошибки возвращаем исходный текст
    }
}

async function main() {
    console.log('🚀 Запуск регенерации описаний (Verbose Mode)...');
    
    const rawData = fs.readFileSync('all_products_full.json', 'utf8');
    const allProductsJson = JSON.parse(rawData);
    
    console.log(`📂 Найдено ${allProductsJson.length} товаров в JSON для сверки.`);

    const snapshot = await db.collection('products').get();
    const productsToUpdate = snapshot.docs;

    console.log(`🔥 Будет обновлено ${productsToUpdate.length} товаров в базе данных.`);
    
    let count = 0;
    for (const doc of productsToUpdate) {
        const firestoreProduct = doc.data();
        count++;
        
        // Находим исходное описание в JSON, чтобы избежать "двойной" обработки
        const originalProduct = allProductsJson.find(p => p.name === firestoreProduct.name);
        
        if (!originalProduct) {
            console.log(`- [${count}/${productsToUpdate.length}] Пропуск "${firestoreProduct.name}" (не найден в исходном JSON)`);
            continue;
        }

        console.log(`- [${count}/${productsToUpdate.length}] Обновляю "${firestoreProduct.name}"...`);
        
        const newVerboseDescription = await generateVerboseDescription(originalProduct.description);
        
        await db.collection('products').doc(doc.id).update({
            description: newVerboseDescription
        });

        await sleep(1500); // Пауза для API
    }

    console.log('\n🏁 Регенерация завершена.');
}

main();
