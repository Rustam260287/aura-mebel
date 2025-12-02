
import fs from 'fs/promises';
import admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const ALL_PRODUCTS_FILE = 'all_products_full.json';
const SERVICE_ACCOUNT_FILE = 'serviceAccountKey.json';
const BUCKET_NAME = 'aura-mebel-7ec96.firebasestorage.app';

// --- Firebase Initialization ---
async function initializeFirebase() {
  try {
    if (admin.apps.length === 0) {
      const serviceAccountContent = await fs.readFile(SERVICE_ACCOUNT_FILE, 'utf-8');
      const serviceAccount = JSON.parse(serviceAccountContent);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: BUCKET_NAME,
      });
      console.log('Firebase Admin initialized successfully.');
    }
    return admin.storage().bucket();
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
}

// --- URL Checker ---
async function checkUrlExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// --- Main Image Processing Function ---
async function discoverAndUploadImages() {
  const bucket = await initializeFirebase();
  
  console.log('Reading product data...');
  const allProductsContent = await fs.readFile(ALL_PRODUCTS_FILE, 'utf-8');
  const products = JSON.parse(allProductsContent);

  console.log(`Found ${products.length} products. Starting robust image discovery...`);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    if (!product.imageUrls) product.imageUrls = [];

    // Clear existing Firebase URLs to re-process everything cleanly
    const originalImageCount = product.imageUrls.length;
    product.imageUrls = product.imageUrls.filter(url => !url.includes('firebasestorage.googleapis.com'));
    
    if (product.imageUrls.length < originalImageCount) {
        console.log(`(${i + 1}/${products.length}) ${product.name}: Cleared ${originalImageCount - product.imageUrls.length} old Firebase images.`);
    } else {
        console.log(`(${i + 1}/${products.length}) Processing ${product.name}.`);
    }

    if (product.imageUrls.length === 0) {
      console.log(`  Skipping - no base image URL to derive from.`);
      continue;
    }
    
    const baseImageUrl = product.imageUrls.find(url => url.includes('label-com.ru'));
    
    if (!baseImageUrl) {
         console.log(`  No label-com.ru image found to guess pattern from.`);
         continue;
    }

    const match = baseImageUrl.match(/^(.*\/)(.*?)(?:\d+)?(\.\w+)$/);
    if (!match) {
        console.log(`  Could not parse base URL: ${baseImageUrl}`);
        continue;
    }

    const [_, baseUrl, baseName, extension] = match;

    for (let j = 1; j <= 7; j++) {
      if (product.imageUrls.length >= 7) {
          console.log(`    Limit of 7 images reached.`);
          break;
      }

      const newImageUrl = `${baseUrl}${baseName}${j}${extension}`;
      if (product.imageUrls.includes(newImageUrl)) continue;
      
      const exists = await checkUrlExists(newImageUrl);

      if (exists) {
        console.log(`  [${j}] Found: ${newImageUrl}`);
        try {
            const imageResponse = await fetch(newImageUrl);
            if (!imageResponse.ok) throw new Error(`Download failed`);
            
            const originalBuffer = Buffer.from(await imageResponse.arrayBuffer());
            let uploadBuffer = null;
            let fileExtension = '';
            let contentType = '';
            
            // --- Robust WebP Conversion with Fallback ---
            try {
                uploadBuffer = await sharp(originalBuffer).webp({ quality: 80 }).toBuffer();
                fileExtension = 'webp';
                contentType = 'image/webp';
                console.log(`    ✓ Converted to WebP`);
            } catch (conversionError) {
                console.warn(`    ! WebP conversion failed: ${conversionError.message}. Uploading original format.`);
                uploadBuffer = originalBuffer;
                contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
                fileExtension = contentType.split('/')[1] || 'jpg';
            }

            const fileName = `products/${product.id || randomUUID()}_${randomUUID()}.${fileExtension}`;
            const file = bucket.file(fileName);
            
            await file.save(uploadBuffer, { metadata: { contentType } });

            const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: '03-17-2030' });
            
            product.imageUrls.push(signedUrl);
            console.log(`    ✓ Uploaded & Signed: ...${fileName.slice(-15)}`);

        } catch (uploadError) {
            console.error(`    ✗ Critical failure for ${newImageUrl}:`, uploadError.message);
        }
      }
    }
  }

  console.log('Writing updated data to all_products_full.json...');
  await fs.writeFile(ALL_PRODUCTS_FILE, JSON.stringify(products, null, 2));
  console.log('Successfully updated product file with new Signed URLs!');
}

discoverAndUploadImages();
