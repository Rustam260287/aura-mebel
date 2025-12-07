
import { getAdminDb } from './lib/firebaseAdmin.ts';

async function validateAllProducts() {
  console.log('Connecting to Firestore to validate all products...');
  const db = getAdminDb();
  const productsRef = db.collection('products');
  
  const snapshot = await productsRef.get();

  if (snapshot.empty) {
    console.log('No products found.');
    return;
  }

  let invalidCount = 0;
  
  console.log(`--- Validating ${snapshot.size} products ---`);

  snapshot.forEach(doc => {
    const p = doc.data();
    const issues = [];

    if (typeof p.name !== 'string' || p.name.trim() === '') {
      issues.push('Missing or empty name');
    }
    if (typeof p.price !== 'number' || isNaN(p.price)) {
      issues.push(`Invalid price: ${p.price}`);
    }
    if (typeof p.category !== 'string' || p.category.trim() === '') {
      issues.push('Missing or empty category');
    }
    if (!Array.isArray(p.imageUrls)) {
      issues.push('imageUrls is missing or not an array');
    }
    
    // Проверяем рейтинг, если он есть
    if (p.rating !== undefined && (typeof p.rating !== 'number' || isNaN(p.rating))) {
        issues.push(`Invalid rating: ${p.rating}`);
    }

    if (issues.length > 0) {
      invalidCount++;
      console.log(`- INVALID Product ID: ${doc.id}, Name: "${p.name || 'N/A'}". Issues: ${issues.join(', ')}`);
    }
  });

  console.log('--- Validation Complete ---');
  if (invalidCount > 0) {
    console.log(`Found ${invalidCount} invalid products that could cause a 500 error.`);
  } else {
    console.log('All products seem to have the correct data structure.');
  }
}

validateAllProducts().catch(error => {
    console.error('Validation script failed:', error);
});
