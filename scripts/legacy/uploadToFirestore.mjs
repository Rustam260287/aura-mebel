
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function uploadProducts() {
  const products = JSON.parse(fs.readFileSync('./all_products.json', 'utf8'));
  console.log(`Loaded ${products.length} products to upload.`);

  const batch = db.batch();

  for (const product of products) {
    const docRef = db.collection('products').doc();
    
    // ИСПРАВЛЕНИЕ: Добавляем объект details
    const productData = {
      name: product.name,
      price: product.price,
      description: product.description || '',
      imageUrls: product.imageUrls || [],
      category: product.category || 'Разное',
      originalUrl: product.originalUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 0,
      reviews: [],
      details: { // Вот это исправление
        dimensions: product.description.match(/Ш\.\s*([\d\s]+)/)?.[1]?.trim() || '',
        material: '', // Парсер не собирал эти данные, оставляем пустыми
        care: ''
      }
    };
    
    // Попытка извлечь размеры из описания, если возможно.
    // Пример: "КРОВАТЬ Ш. 2220 В. 1440 Д. 2040"
    const dimsMatch = product.description.match(/Ш\.\s*([\d\s]+)\s*В\.\s*([\d\s]+)\s*[ГД]\.\s*([\d\s]+)/);
    if (dimsMatch) {
        productData.details.dimensions = `${dimsMatch[1]} x ${dimsMatch[2]} x ${dimsMatch[3]}`;
    }

    batch.set(docRef, productData);
  }

  await batch.commit();

  console.log(`Done! Successfully uploaded ${products.length} products to Firestore.`);
}

uploadProducts().catch(console.error);
