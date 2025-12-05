
import { getAdminDb } from './lib/firebaseAdmin.ts';

async function updateFirestorePrices() {
  console.log('Connecting to Firestore...');
  const db = getAdminDb();
  const productsRef = db.collection('products');
  
  console.log('Fetching all products from the database...');
  const snapshot = await productsRef.get();

  if (snapshot.empty) {
    console.log('No products found in the database.');
    return;
  }

  const batch = db.batch();
  let updatedCount = 0;

  console.log(`Found ${snapshot.size} products. Calculating new prices...`);

  snapshot.forEach(doc => {
    const product = doc.data();
    if (product.price) {
      const currentPrice = product.price;
      let newPrice;

      if (product.category === 'Кухни') {
        // Увеличение на 30% для кухонь
        newPrice = Math.round(currentPrice * 1.3);
      } else {
        // Увеличение на 20% для остального
        newPrice = Math.round(currentPrice * 1.2);
      }

      if (newPrice !== currentPrice) {
        const docRef = productsRef.doc(doc.id);
        batch.update(docRef, { price: newPrice });
        updatedCount++;
        // console.log(`- ${product.name}: ${currentPrice} -> ${newPrice}`);
      }
    }
  });

  if (updatedCount > 0) {
    console.log(`Updating ${updatedCount} products in the database. This may take a moment...`);
    await batch.commit();
    console.log('Successfully updated prices in Firestore!');
  } else {
    console.log('No prices needed updating.');
  }
}

updateFirestorePrices().catch(error => {
    console.error('Failed to update Firestore prices:', error);
});
