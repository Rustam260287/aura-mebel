
import admin from 'firebase-admin';
import fs from 'fs';
import dotenv from 'dotenv';
import { promisify } from 'util';

dotenv.config({ path: '.env.local' });
const sleep = promisify(setTimeout);

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
    console.log('🚀 Запуск ребрендинга в базе данных...');
    
    const snapshot = await db.collection('products').get();
    const productsToUpdate = snapshot.docs;

    console.log(`🔍 Найдено ${productsToUpdate.length} товаров для обновления.`);
    
    let count = 0;
    for (const doc of productsToUpdate) {
        const product = doc.data();
        count++;

        if (product.description && product.description.includes('Аура')) {
            console.log(`- [${count}/${productsToUpdate.length}] Обновляю "${product.name}"...`);
            
            const newDescription = product.description.replace(/Аура/g, 'Labelcom');
            
            await db.collection('products').doc(doc.id).update({
                description: newDescription
            });
        } else {
             console.log(`- [${count}/${productsToUpdate.length}] Пропуск "${product.name}" (не содержит "Аура").`);
        }
    }

    console.log('\n🏁 Ребрендинг базы данных завершен.');
}

main();
