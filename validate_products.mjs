
import { getAdminDb } from './lib/firebaseAdmin.ts';

async function validateProducts() {
  const db = getAdminDb();
  const snapshot = await db.collection('products').get();
  
  console.log(`Validating ${snapshot.size} products...`);
  
  snapshot.forEach(doc => {
    const p = doc.data();
    const issues = [];

    if (!p.name) issues.push('Missing name');
    if (typeof p.price !== 'number' || isNaN(p.price)) issues.push(`Invalid price: ${p.price}`);
    if (!p.description) issues.push('Missing description'); // Не критично, но важно
    if (!Array.isArray(p.imageUrls)) issues.push('imageUrls is not an array');
    
    if (issues.length > 0) {
        console.log(`- Product "${p.name || 'Unknown'}" (ID: ${doc.id}) has issues: ${issues.join(', ')}`);
    }
  });
  console.log('Validation complete.');
}

validateProducts();
