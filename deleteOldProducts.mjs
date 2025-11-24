
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Загружаем ключи
const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

// Инициализация
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function deleteOldProducts() {
  console.log('Scanning for old products...');
  const snapshot = await db.collection('products').get();
  
  if (snapshot.empty) {
    console.log('No products found.');
    return;
  }

  let batch = db.batch();
  let count = 0;
  let deletedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // КРИТЕРИЙ: Если нет поля originalUrl или оно не содержит label-com.ru, считаем товар старым
    if (!data.originalUrl || !data.originalUrl.includes('label-com.ru')) {
      batch.delete(doc.ref);
      count++;
      deletedCount++;
      // console.log(`Marked for deletion: ${data.name}`);
    }

    // Firestore batch limit is 500
    if (count >= 400) {
      await batch.commit();
      console.log(`Deleted batch of ${count} items...`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`Done! Deleted ${deletedCount} old products. kept the new ones.`);
}

deleteOldProducts().catch(console.error);
