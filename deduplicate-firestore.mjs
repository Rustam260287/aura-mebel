
import fs from 'fs/promises';
import admin from 'firebase-admin';
import { randomUUID } from 'crypto';

const SERVICE_ACCOUNT_FILE = 'serviceAccountKey.json';
const FINAL_PRODUCTS_FILE = 'all_products_final.json';

// --- Firebase Initialization ---
async function initializeFirebase() {
  try {
    if (admin.apps.length === 0) {
      const serviceAccountContent = await fs.readFile(SERVICE_ACCOUNT_FILE, 'utf-8');
      const serviceAccount = JSON.parse(serviceAccountContent);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully.');
    }
    return admin.firestore();
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
}

// --- Slugify function to create clean IDs ---
function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// --- Main Deduplication Logic ---
async function deduplicateProducts() {
  const db = await initializeFirebase();
  const productsRef = db.collection('products');
  const snapshot = await productsRef.get();

  if (snapshot.empty) {
    console.log('No products found in Firestore. Nothing to do.');
    return;
  }

  console.log(`Fetched ${snapshot.size} documents from Firestore.`);

  const uniqueProducts = new Map();

  snapshot.docs.forEach(doc => {
    const product = doc.data();
    if (!product.name) {
      console.warn(`Skipping document with ID ${doc.id} because it has no name.`);
      return;
    }

    const existing = uniqueProducts.get(product.name);

    if (!existing) {
      uniqueProducts.set(product.name, product);
    } else {
      // --- Logic to decide which version is "better" ---
      const imageCount = product.imageUrls?.length || 0;
      const existingImageCount = existing.imageUrls?.length || 0;
      const descriptionLength = product.description?.length || 0;
      const existingDescriptionLength = existing.description?.length || 0;

      // Keep the one with more images. If equal, keep the one with the longer description.
      if (imageCount > existingImageCount) {
        uniqueProducts.set(product.name, product);
      } else if (imageCount === existingImageCount && descriptionLength > existingDescriptionLength) {
        uniqueProducts.set(product.name, product);
      }
    }
  });

  console.log(`Found ${uniqueProducts.size} unique products after deduplication.`);

  // --- Finalize product list with stable IDs ---
  const finalProductList = [];
  for (const product of uniqueProducts.values()) {
    // Generate a stable, clean ID from the name
    product.id = slugify(product.name);
    if (!product.id) {
        product.id = randomUUID(); // Fallback for empty names after slugify
    }
    finalProductList.push(product);
  }

  console.log(`Saving ${finalProductList.length} unique products to ${FINAL_PRODUCTS_FILE}...`);
  await fs.writeFile(FINAL_PRODUCTS_FILE, JSON.stringify(finalProductList, null, 2));

  console.log('Successfully created the final, deduplicated product list.');
}

deduplicateProducts();
