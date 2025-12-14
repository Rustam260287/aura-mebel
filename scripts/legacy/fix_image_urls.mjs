
import { getAdminDb } from './lib/firebaseAdmin.ts';

async function fixImageUrls() {
  console.log('Connecting to Firestore...');
  const db = getAdminDb();
  const productsRef = db.collection('products');
  
  console.log('Fetching all products...');
  const snapshot = await productsRef.get();

  if (snapshot.empty) {
    console.log('No products found.');
    return;
  }

  const batch = db.batch();
  let updatedCount = 0;
  const domain = 'https://label-com.ru';

  console.log(`Checking ${snapshot.size} products for broken image URLs...`);

  snapshot.forEach(doc => {
    const product = doc.data();
    const imageUrls = product.imageUrls;
    let needsUpdate = false;

    // Проверяем, есть ли поле и является ли оно массивом
    if (Array.isArray(imageUrls)) {
      const correctedUrls = imageUrls.map(url => {
        // Исправляем URL, если он начинается с /upload/
        if (typeof url === 'string' && url.startsWith('/upload/')) {
          needsUpdate = true;
          return `${domain}${url}`;
        }
        return url;
      });

      if (needsUpdate) {
        const docRef = productsRef.doc(doc.id);
        batch.update(docRef, { imageUrls: correctedUrls });
        updatedCount++;
        console.log(`- Fixing images for: ${product.name}`);
      }
    }
  });

  if (updatedCount > 0) {
    console.log(`Found ${updatedCount} products with broken URLs. Applying fixes...`);
    await batch.commit();
    console.log('Successfully fixed image URLs in Firestore!');
  } else {
    console.log('No broken image URLs found.');
  }
}

fixImageUrls().catch(error => {
    console.error('Failed to fix image URLs:', error);
});
