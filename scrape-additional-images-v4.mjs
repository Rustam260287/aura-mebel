
import fs from 'fs/promises';
import admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const FINAL_PRODUCTS_FILE = 'all_products_final.json';
const SERVICE_ACCOUNT_FILE = 'serviceAccountKey.json';
const BUCKET_NAME = 'aura-mebel-7ec96.appspot.com'; // Используем стандартное имя бакета

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
  const allProductsContent = await fs.readFile(FINAL_PRODUCTS_FILE, 'utf-8');
  const products = JSON.parse(allProductsContent);

  console.log(`Starting final image processing for ${products.length} products...`);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    const originalUrls = product.imageUrls.filter(url => url.includes('label-com.ru'));
    product.imageUrls = product.imageUrls.filter(url => !url.includes('label-com.ru'));

    console.log(`(${i + 1}/${products.length}) Processing ${product.name}.`);

    if (originalUrls.length === 0) {
      console.log(`  No original URLs to process. Skipping.`);
      continue;
    }
    
    const baseImageUrl = originalUrls[0];
    const match = baseImageUrl.match(/^(.*\/)(.*?)(?:\d+)?(\.\w+)$/);
    if (!match) {
        console.log(`  Could not parse base URL: ${baseImageUrl}`);
        product.imageUrls.push(...originalUrls);
        continue;
    }

    const [_, baseUrl, baseName, extension] = match;

    for (let j = 1; j <= 7; j++) {
      if (product.imageUrls.length >= 7) {
          console.log(`    Limit of 7 images reached.`);
          break;
      }

      const newImageUrl = `${baseUrl}${baseName}${j}${extension}`;
      
      const exists = await checkUrlExists(newImageUrl);

      if (exists) {
        console.log(`  [${j}] Found: ${newImageUrl}`);
        try {
            const imageResponse = await fetch(newImageUrl);
            if (!imageResponse.ok) throw new Error(`Download failed`);
            
            const originalBuffer = Buffer.from(await imageResponse.arrayBuffer());
            const webpBuffer = await sharp(originalBuffer).webp({ quality: 80 }).toBuffer();

            const fileName = `products/${product.id}_${randomUUID()}.webp`;
            const file = bucket.file(fileName);
            
            await file.save(webpBuffer, {
                metadata: { contentType: 'image/webp' },
                public: true, // Делаем файл публичным
            });

            const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
            product.imageUrls.push(publicUrl);
            console.log(`    ✓ Uploaded as public: ${publicUrl}`);

        } catch (uploadError) {
            console.warn(`    ! Failed to process ${newImageUrl}, keeping original URL.`);
            product.imageUrls.push(newImageUrl);
        }
      }
    }
  }

  console.log('Writing final data to all_products_final.json...');
  await fs.writeFile(FINAL_PRODUCTS_FILE, JSON.stringify(products, null, 2));
  console.log('Successfully created the final product list with public WebP images!');
}

discoverAndUploadImages();
