
import { getAdminDb } from './lib/firebaseAdmin.ts';

async function debugImageUrls() {
  console.log('Connecting to Firestore...');
  const db = getAdminDb();
  const productsRef = db.collection('products');
  
  console.log('Fetching the latest products to debug their image URLs...');
  // Firestore не может сортировать по "времени добавления", если нет timestamp.
  // Поэтому мы просто возьмем 10 случайных документов для анализа.
  const snapshot = await productsRef.limit(10).get();

  if (snapshot.empty) {
    console.log('No products found.');
    return;
  }
  
  console.log('--- Image URL Debug ---');

  snapshot.forEach(doc => {
    const product = doc.data();
    console.log(`\nProduct: ${product.name}`);
    console.log('Image URLs:', product.imageUrls);
  });

  console.log('-----------------------');
}

debugImageUrls().catch(error => {
    console.error('Debug script failed:', error);
});
