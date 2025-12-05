
import { getAdminDb } from './lib/firebaseAdmin.ts';

async function checkStrangeIds() {
  const db = getAdminDb();
  const snapshot = await db.collection('products').get();
  
  console.log(`Checking ${snapshot.size} products for strange IDs...`);
  
  let strangeCount = 0;
  snapshot.forEach(doc => {
    // Проверяем, если ID короткий, числовой или начинается с минуса
    if (doc.id.length < 5 || !isNaN(Number(doc.id)) || doc.id.startsWith('-')) {
      console.log(`- Strange ID found: "${doc.id}" (Name: ${doc.data().name})`);
      strangeCount++;
    }
  });

  if (strangeCount === 0) {
    console.log('No strange IDs found. All IDs look like Firestore auto-IDs.');
  }
}

checkStrangeIds();
