
import fs from 'fs/promises';
import { getAdminDb } from './lib/firebaseAdmin.ts';

async function syncProducts() {
  const inputFile = 'all_products_final.json';
  
  try {
    // 1. Подключаемся к Firestore
    console.log('Connecting to Firestore...');
    const db = getAdminDb();
    const productsRef = db.collection('products');
    
    // 2. Читаем локальный JSON файл
    console.log(`Reading local file: ${inputFile}...`);
    const data = await fs.readFile(inputFile, 'utf-8');
    const localProducts = JSON.parse(data);
    console.log(`Found ${localProducts.length} products in the local file.`);

    // 3. Получаем все товары из Firestore, чтобы проверить, что уже существует
    console.log('Fetching existing products from Firestore...');
    const snapshot = await productsRef.get();
    const firestoreProducts = new Map();
    snapshot.forEach(doc => {
      // Используем originalUrl как уникальный ключ, если он есть, иначе - имя
      const key = doc.data().originalUrl || doc.data().name.toLowerCase();
      firestoreProducts.set(key, doc.id);
    });
    console.log(`Found ${firestoreProducts.size} products in Firestore.`);

    // 4. Находим недостающие товары и добавляем их
    const batch = db.batch();
    let newProductsCount = 0;

    localProducts.forEach(product => {
      const key = product.originalUrl || product.name.toLowerCase();
      if (!firestoreProducts.has(key)) {
        // Этого товара нет в базе, добавляем
        const docRef = productsRef.doc(); // Firestore сгенерирует ID
        batch.set(docRef, product);
        newProductsCount++;
        console.log(`- Adding: ${product.name}`);
      }
    });

    if (newProductsCount > 0) {
      console.log(`Adding ${newProductsCount} new products to the database...`);
      await batch.commit();
      console.log('Successfully added new products to Firestore!');
    } else {
      console.log('No new products to add. Database is up to date.');
    }

  } catch (error) {
    console.error('An error occurred during synchronization:', error);
  }
}

syncProducts();
