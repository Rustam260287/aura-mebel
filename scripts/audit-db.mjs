
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Инициализация (используем сервисный аккаунт из переменных окружения или дефолтный)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    if (Object.keys(serviceAccount).length > 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        // Fallback for local dev without env var properly set for script
        admin.initializeApp();
    }
  } catch (e) {
      console.error("Failed to init firebase admin:", e);
      process.exit(1);
  }
}

const db = admin.firestore();

async function auditProducts() {
  console.log("Starting product audit...");
  const productsSnap = await db.collection('products').get();
  const total = productsSnap.size;
  console.log(`Total products found: ${total}`);

  let missingImages = 0;
  let missingPrice = 0;
  let missingName = 0;
  let missingDescription = 0;
  let lowQualityDescription = 0; // Short description
  let brokenImageUrls = 0;

  productsSnap.forEach(doc => {
    const p = doc.data();
    
    if (!p.name) missingName++;
    if (!p.price && p.price !== 0) missingPrice++; // Price can be 0?
    if (!p.imageUrls || !Array.isArray(p.imageUrls) || p.imageUrls.length === 0) {
        missingImages++;
    } else {
        // Check for obviously broken URLs
        p.imageUrls.forEach(url => {
            if (typeof url !== 'string' || (!url.startsWith('http') && !url.startsWith('/'))) {
                brokenImageUrls++;
            }
        });
    }

    if (!p.description) {
        missingDescription++;
    } else if (p.description.length < 20) {
        lowQualityDescription++;
    }
  });

  console.log("--- Audit Results ---");
  console.log(`Missing Name: ${missingName}`);
  console.log(`Missing Price: ${missingPrice}`);
  console.log(`Missing/Empty Images: ${missingImages}`);
  console.log(`Broken Image URLs found: ${brokenImageUrls}`);
  console.log(`Missing Description: ${missingDescription}`);
  console.log(`Low Quality Description (<20 chars): ${lowQualityDescription}`);
  
  if (missingName > 0 || missingPrice > 0 || missingImages > 0) {
      console.log("\nCRITICAL ISSUES FOUND. Review data quality.");
  } else {
      console.log("\nData structure looks generally okay.");
  }
}

auditProducts().catch(console.error);
