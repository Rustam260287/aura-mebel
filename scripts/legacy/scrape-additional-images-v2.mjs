
import fs from 'fs/promises';
import admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const ALL_PRODUCTS_FILE = 'all_products_full.json';
const SERVICE_ACCOUNT_FILE = 'serviceAccountKey.json';
const BUCKET_NAME = 'aura-mebel-7ec96.firebasestorage.app';

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

async function checkUrlExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function discoverAndUploadImages() {
  const bucket = await initializeFirebase();
  
  console.log('Reading product data...');
  const allProductsContent = await fs.readFile(ALL_PRODUCTS_FILE, 'utf-8');
  const products = JSON.parse(allProductsContent);

  console.log(`Found ${products.length} products. Starting image discovery and WebP conversion...`);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    if (!product.imageUrls) {
        product.imageUrls = [];
    }

    // Удаляем ранее загруженные изображения из Firebase (чтобы заменить их на Signed URLs и обновить лимит)
    const originalLength = product.imageUrls.length;
    // Фильтруем любые ссылки на firebase storage, чтобы начать "с чистого листа" для доп. картинок
    product.imageUrls = product.imageUrls.filter(url => !url.includes('firebasestorage.googleapis.com') && !url.includes('storage.googleapis.com'));
    
    if (product.imageUrls.length < originalLength) {
        console.log(`(${i + 1}/${products.length}) ${product.name}: Cleared existing Firebase images to re-fetch and sign.`);
    } else {
        console.log(`(${i + 1}/${products.length}) Processing ${product.name}.`);
    }

    if (product.imageUrls.length === 0) {
      console.log(`  Skipping - no base image URL`);
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
    let newImagesFoundCount = 0;

    // Перебираем варианты от 1 до 7 (было 15)
    for (let j = 1; j <= 7; j++) {
      // Проверка лимита (7)
      if (product.imageUrls.length >= 7) {
          console.log(`    Limit of 7 images reached. Stopping.`);
          break;
      }

      const newImageUrl = `${baseUrl}${baseName}${j}${extension}`;

      // Проверяем, есть ли уже этот URL в списке (чтобы не дублировать исходные ссылки)
      if (product.imageUrls.includes(newImageUrl)) {
          continue;
      }
      
      const exists = await checkUrlExists(newImageUrl);

      if (exists) {
        newImagesFoundCount++;
        console.log(`  [${j}] Found: ${newImageUrl}`);
        try {
            const imageResponse = await fetch(newImageUrl);
            if (!imageResponse.ok) throw new Error(`Failed to download`);
            
            const arrayBuffer = await imageResponse.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);
            
            // Конвертация в WebP
            const webpBuffer = await sharp(imageBuffer)
                .webp({ quality: 80 })
                .toBuffer();

            const contentType = 'image/webp';
            const fileExtension = 'webp';
            const fileName = `products/${product.id}_${randomUUID()}.${fileExtension}`;
            
            const file = bucket.file(fileName);
            await file.save(webpBuffer, {
                metadata: { contentType },
                resumable: false
            });

            // Генерируем Signed URL (действителен до 2030 года)
            const [signedUrl] = await file.getSignedUrl({
                action: 'read',
                expires: '03-17-2030',
            });
            
            if (!product.imageUrls.includes(signedUrl)) {
                 product.imageUrls.push(signedUrl);
            }
            console.log(`    ✓ Uploaded & Signed: ...${fileName.split('_').pop()}`);

        } catch (uploadError) {
            // Игнорируем ошибки о неподдерживаемом формате, если они возникают
            if (!uploadError.message.includes('Input buffer contains unsupported image format')) {
                console.error(`    ✗ Failed to process ${newImageUrl}:`, uploadError.message);
            }
        }
      }
    }
  }

  console.log('Writing updated data back to file...');
  await fs.writeFile(ALL_PRODUCTS_FILE, JSON.stringify(products, null, 2));

  console.log('Successfully updated all_products_full.json with Signed WebP images (limit 7)!');
}

discoverAndUploadImages();
