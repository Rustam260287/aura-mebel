
import { getAdminDb } from './lib/firebaseAdmin.ts';

async function deleteBrokenProducts() {
  console.log('Connecting to Firestore...');
  const db = getAdminDb();
  const productsRef = db.collection('products');
  
  console.log('Fetching all products to find broken ones...');
  const snapshot = await productsRef.get();

  if (snapshot.empty) {
    console.log('No products found.');
    return;
  }

  const batch = db.batch();
  let deletedCount = 0;

  snapshot.forEach(doc => {
    const product = doc.data();
    const imageUrls = product.imageUrls;

    if (Array.isArray(imageUrls)) {
      // Ищем хотя бы один URL, который содержит ".html"
      const hasBrokenUrl = imageUrls.some(url => typeof url === 'string' && url.includes('.html'));
      
      if (hasBrokenUrl) {
        console.log(`- Marking for deletion: ${product.name} (ID: ${doc.id})`);
        batch.delete(doc.ref);
        deletedCount++;
      }
    }
  });

  if (deletedCount > 0) {
    console.log(`Found ${deletedCount} products with broken image URLs. Deleting them now...`);
    await batch.commit();
    console.log('Successfully deleted broken products!');
  } else {
    console.log('No products with .html image URLs found to delete.');
  }
}

deleteBrokenProducts().catch(error => {
    console.error('Failed to delete broken products:', error);
});
