
import admin from 'firebase-admin';
import fs from 'fs/promises';

const SERVICE_ACCOUNT_FILE = 'serviceAccountKey.json';

async function initializeFirebase() {
  if (admin.apps.length === 0) {
    const serviceAccountContent = await fs.readFile(SERVICE_ACCOUNT_FILE, 'utf-8');
    const serviceAccount = JSON.parse(serviceAccountContent);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized successfully.');
  }
  return admin.firestore();
}

async function deleteAllProducts() {
  const db = await initializeFirebase();
  const collectionRef = db.collection('products');
  const batchSize = 400;

  console.log("Starting reliable deletion of all products...");

  let snapshot;
  do {
    snapshot = await collectionRef.limit(batchSize).get();
    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted a batch of ${snapshot.size} products.`);

  } while (!snapshot.empty);

  console.log("All products have been successfully deleted from Firestore.");
}

deleteAllProducts();
