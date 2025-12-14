
import { getAdminDb } from './lib/firebaseAdmin.ts';

async function countProducts() {
  const db = getAdminDb();
  const snapshot = await db.collection('products').get();
  console.log(`Total products in Firestore: ${snapshot.size}`);
}

countProducts();
