
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Загружаем ключ сервисного аккаунта
const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

// Инициализируем Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function uploadProducts() {
  const products = JSON.parse(fs.readFileSync('./all_products.json', 'utf8'));
  console.log(`Loaded ${products.length} products to upload.`);

  const batchSize = 100; // Firestore limit is 500, but let's be safe
  let batch = db.batch();
  let count = 0;
  let totalUploaded = 0;

  for (const product of products) {
    // Создаем новый ID или используем существующий, если есть уникальное поле
    const docRef = db.collection('products').doc();
    
    // Подготовка данных
    const productData = {
      name: product.name,
      price: product.price,
      // Если цена 0, можно добавить пометку или скрыть товар
      // isVisible: product.price > 0, 
      description: product.description || '',
      imageUrls: product.imageUrls || [],
      category: product.category || 'Разное',
      originalUrl: product.originalUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 0,
      reviews: []
    };

    batch.set(docRef, productData);
    count++;

    if (count >= batchSize) {
      await batch.commit();
      totalUploaded += count;
      console.log(`Uploaded ${totalUploaded} products...`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    totalUploaded += count;
  }

  console.log(`Done! Successfully uploaded ${totalUploaded} products to Firestore.`);
}

uploadProducts().catch(console.error);
