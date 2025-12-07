
import { getAdminDb, getAdminStorage } from './lib/firebaseAdmin.js'; // Используем .js версию либы
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const BASE_LOCAL_PATH = 'label-com-download';
const JSON_FILE = 'label-com-download/products.json';

async function uploadLocalImages() {
  console.log('Connecting to Firebase...');
  const db = getAdminDb();
  const bucket = getAdminStorage().bucket();
  const productsRef = db.collection('products');

  console.log(`Reading ${JSON_FILE}...`);
  try {
    const data = await fs.readFile(JSON_FILE, 'utf-8');
    const products = JSON.parse(data);
    
    console.log(`Found ${products.length} products in JSON. Processing...`);
    
    let processedCount = 0;
    let skippedCount = 0;

    for (const productData of products) {
        // Находим товар в базе по имени (или slug/originalUrl, но имя надежнее для сопоставления)
        // В идеале у нас должен быть ID, но в JSON его нет.
        // Будем искать по имени.
        
        const snapshot = await productsRef.where('name', '==', productData.name).limit(1).get();
        
        if (snapshot.empty) {
            // console.log(`Product not found in DB: ${productData.name} - Skipping`);
            skippedCount++;
            continue;
        }

        const doc = snapshot.docs[0];
        const currentProduct = doc.data();

        // Проверяем, есть ли локальные картинки в JSON
        if (!productData.localImages || productData.localImages.length === 0) {
            continue;
        }

        const newImageUrls = [];
        let hasNewUploads = false;

        for (const relativePath of productData.localImages) {
            // Формируем полный путь к файлу
            // relativePath в JSON выглядит как "images/model-novella/01.jpeg"
            // Реальный путь: label-com-download/images/model-novella/01.jpeg
            const localFilePath = path.join(BASE_LOCAL_PATH, relativePath);
            
            try {
                // Проверяем, существует ли файл
                await fs.access(localFilePath);
                
                // Читаем файл
                const buffer = await fs.readFile(localFilePath);
                
                // Загружаем в Storage
                const ext = path.extname(localFilePath).toLowerCase();
                const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
                const filename = `products/${doc.id}/${randomUUID()}${ext}`;
                const file = bucket.file(filename);

                await file.save(buffer, {
                    metadata: { contentType, cacheControl: 'public, max-age=31536000' }
                });
                
                await file.makePublic();
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
                
                newImageUrls.push(publicUrl);
                hasNewUploads = true;
                // console.log(`  + Uploaded: ${localFilePath}`);

            } catch (err) {
                // Если файла нет локально, пропускаем
                // console.warn(`  - File not found: ${localFilePath}`);
            }
        }

        // Если удалось загрузить новые картинки, обновляем базу
        if (hasNewUploads && newImageUrls.length > 0) {
            // Можно заменить старые (которые могут быть битыми) или добавить к ним.
            // Учитывая, что мы чинили базу, лучше ЗАМЕНИТЬ, так как локальные копии точно хорошие.
            await doc.ref.update({ imageUrls: newImageUrls });
            console.log(`Updated images for: ${productData.name} (${newImageUrls.length} images)`);
            processedCount++;
        }
    }

    console.log('------------------------------------------------');
    console.log(`Upload complete.`);
    console.log(`Products updated with local images: ${processedCount}`);
    console.log(`Products skipped (not found in DB or no local images): ${skippedCount}`);

  } catch (error) {
    console.error('Error in main loop:', error);
  }
}

uploadLocalImages();
