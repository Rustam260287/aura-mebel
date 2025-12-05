
import { getAdminDb } from './lib/firebaseAdmin.ts';

async function fixMissingDescriptions() {
  const db = getAdminDb();
  const snapshot = await db.collection('products').get();
  const batch = db.batch();
  let updatedCount = 0;

  snapshot.forEach(doc => {
    const p = doc.data();
    if (!p.description) {
      batch.update(doc.ref, { 
          description: `Изысканная мебель ${p.name} от Labelcom. Высокое качество материалов, современный дизайн. Идеальное решение для вашего интерьера.` 
      });
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`Fixed descriptions for ${updatedCount} products.`);
  } else {
    console.log("No missing descriptions.");
  }
}

fixMissingDescriptions();
