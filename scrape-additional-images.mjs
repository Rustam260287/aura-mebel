
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import admin from 'firebase-admin';
import { randomUUID } from 'crypto';

const ALL_PRODUCTS_FILE = 'all_products_full.json';
const SERVICE_ACCOUNT_FILE = 'serviceAccountKey.json';
const BUCKET_NAME = 'aura-mebel-7ec96.appspot.com';

async function initializeFirebase() {
  try {
    const serviceAccountContent = await fs.readFile(SERVICE_ACCOUNT_FILE, 'utf-8');
    const serviceAccount = JSON.parse(serviceAccountContent);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: BUCKET_NAME,
    });
    console.log('Firebase Admin initialized successfully.');
    return admin.storage().bucket();
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
}

async function downloadAndUploadImages() {
  const bucket = await initializeFirebase();
  
  console.log('Reading product data...');
  const allProductsContent = await fs.readFile(ALL_PRODUCTS_FILE, 'utf-8');
  const products = JSON.parse(allProductsContent);

  console.log(`Found ${products.length} products. Starting image processing...`);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    if (!product.originalUrl) {
      console.log(`(${i + 1}/${products.length}) Skipping ${product.name} - no originalUrl`);
      continue;
    }

    try {
      console.log(`(${i + 1}/${products.length}) Processing ${product.name} from ${product.originalUrl}`);
      const response = await fetch(product.originalUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;

      const imageElements = document.querySelectorAll('a[data-rel="lightcase:my-images"]');
      
      const existingImageUrls = new Set(product.imageUrls || []);
      const newImageUrls = new Set();

      imageElements.forEach(el => {
        const href = el.getAttribute('href');
        if (href) {
            const fullUrl = new URL(href, 'https://label-com.ru/').href;
            if (!existingImageUrls.has(fullUrl)) {
                 newImageUrls.add(fullUrl);
            }
        }
      });
      
      if (newImageUrls.size === 0) {
          console.log('  No new images found.');
          continue;
      }
      
      console.log(`  Found ${newImageUrls.size} new images. Downloading and uploading...`);

      for (const imageUrl of newImageUrls) {
          try {
              const imageResponse = await fetch(imageUrl);
              if (!imageResponse.ok) throw new Error(`Failed to download ${imageUrl}`);
              
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
              const fileExtension = contentType.split('/')[1] || 'jpg';
              const fileName = `products/${product.id}_${randomUUID()}.${fileExtension}`;
              
              const file = bucket.file(fileName);
              await file.save(imageBuffer, {
                  metadata: { contentType },
                  public: true,
              });
              
              const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
              product.imageUrls.push(publicUrl);
              console.log(`    ✓ Uploaded ${publicUrl}`);
          } catch (uploadError) {
              console.error(`    ✗ Failed to process ${imageUrl}:`, uploadError.message);
          }
      }

    } catch (error) {
      console.error(`  Error processing ${product.name}:`, error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
  }

  console.log('Image processing finished. Writing updated data back to file...');
  await fs.writeFile(ALL_PRODUCTS_FILE, JSON.stringify(products, null, 2));

  console.log('Successfully updated all_products_full.json with new images!');
}

downloadAndUploadImages();
