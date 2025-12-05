
import { getAdminDb } from './lib/firebaseAdmin.ts';

async function listAllIds() {
  const db = getAdminDb();
  const snapshot = await db.collection('products').select('name').get();
  
  console.log(`Total documents: ${snapshot.size}`);
  snapshot.forEach(doc => {
    console.log(`${doc.id} : ${doc.data().name}`);
  });
}

listAllIds();
