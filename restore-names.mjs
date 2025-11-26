
import admin from 'firebase-admin';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SERVICE_ACCOUNT_PATH = './service-account-key.json'; 

if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error.message);
        process.exit(1);
    }
}

const db = admin.firestore();

async function main() {
    console.log('🚀 Запуск восстановления оригинальных названий...');
    
    const rawData = fs.readFileSync('all_products_full.json', 'utf8');
    const allProductsJson = JSON.parse(rawData);
    
    const truthSource = new Map();
    allProductsJson.forEach(p => {
        if (p.originalUrl) {
            truthSource.set(p.originalUrl, p.name);
        }
    });
    console.log(`📂 Загружен "источник правды": ${truthSource.size} уникальных товаров из JSON.`);

    const snapshot = await db.collection('products').get();
    const productsToProcess = snapshot.docs;
    console.log(`🔍 Найдено ${productsToProcess.length} товаров в базе для проверки.`);
    
    const batch = db.batch();
    let updatedCount = 0;

    for (const doc of productsToProcess) {
        const product = doc.data();
        
        if (!product.originalUrl) {
            continue;
        }

        const originalName = truthSource.get(product.originalUrl);

        if (originalName && originalName !== product.name) {
            console.log(`  - Восстанавливаю "${product.name}" -> "${originalName}"`);
            const docRef = db.collection('products').doc(doc.id);
            batch.update(docRef, { name: originalName });
            updatedCount++;
        }
    }

    if (updatedCount > 0) {
        console.log(`\n💾 Сохранение ${updatedCount} изменений в базе данных...`);
        await batch.commit();
        console.log('✅ Изменения сохранены.');
    } else {
        console.log('✅ Нет названий для восстановления.');
    }
    
    console.log('🏁 Восстановление названий завершено.');
}

main();
