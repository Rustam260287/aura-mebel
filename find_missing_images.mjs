
import { getAdminDb } from './lib/firebaseAdmin.ts';

async function findMissingImages() {
  console.log('Connecting to Firestore...');
  const db = getAdminDb();
  const productsRef = db.collection('products');
  
  console.log('Fetching all products to check for missing images...');
  const snapshot = await productsRef.get();

  if (snapshot.empty) {
    console.log('No products found.');
    return;
  }

  let missingCount = 0;
  
  console.log('--- Products with missing or empty image URLs ---');

  snapshot.forEach(doc => {
    const product = doc.data();
    const imageUrls = product.imageUrls;

    // Проверяем, отсутствует ли поле, не является ли оно массивом, или массив пустой
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      missingCount++;
      console.log(`- ID: ${doc.id}, Name: ${product.name}`);
    }
  });

  if (missingCount > 0) {
    console.log(`-------------------------------------------------`);
    console.log(`Found ${missingCount} products with missing images.`);
  } else {
    console.log(`-------------------------------------------------`);
    console.log('All products seem to have image URLs.');
  }
}

findMissingImages().catch(error => {
    console.error('Failed to check for missing images:', error);
});
