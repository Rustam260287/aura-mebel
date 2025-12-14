
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function deleteAllProducts() {
  const collectionRef = db.collection('products');
  const snapshot = await collectionRef.limit(500).get();

  if (snapshot.size === 0) {
    console.log('No products to delete.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  console.log(`Deleted ${snapshot.size} products.`);

  // Рекурсивно вызываем, если есть еще что удалять
  if (snapshot.size > 0) {
    await deleteAllProducts();
  }
}

console.log('Starting deletion of all products...');
deleteAllProducts().catch(console.error);
