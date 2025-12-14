
import { getAdminDb, getAdminStorage } from './lib/firebaseAdmin.ts';
import sharp from 'sharp';
import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

async function optimizeImages() {
  console.log('Connecting to Firestore...');
  const db = getAdminDb();
  const bucket = getAdminStorage().bucket();
  const productsRef = db.collection('products');
  
  const snapshot = await productsRef.get();
  console.log(`Found ${snapshot.size} products. Starting optimization...`);

  let processedCount = 0;
  let errorCount = 0;

  for (const doc of snapshot.docs) {
    const product = doc.data();
    const imageUrls = product.imageUrls || [];
    let hasChanges = false;
    const newImageUrls = [];

    console.log(`Processing product: ${product.name} (${doc.id})`);

    for (const url of imageUrls) {
      // Пропускаем, если это уже наш WebP в Firebase Storage
      if (url.includes('firebasestorage') && url.includes('.webp')) {
        newImageUrls.push(url);
        continue;
      }

      try {
        // 1. Скачиваем изображение
        console.log(`  - Downloading: ${url}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
        const buffer = await response.arrayBuffer();

        // 2. Конвертируем в WebP с помощью sharp
        const webpBuffer = await sharp(Buffer.from(buffer))
          .webp({ quality: 80, effort: 6 }) // Хорошее качество, максимальное сжатие
          .toBuffer();

        // 3. Загружаем в Firebase Storage
        const filename = `products/${doc.id}/${randomUUID()}.webp`;
        const file = bucket.file(filename);
        
        await file.save(webpBuffer, {
          metadata: { 
            contentType: 'image/webp',
            cacheControl: 'public, max-age=31536000', // Кешировать на год
          }
        });

        // Делаем файл публичным
        await file.makePublic();
        const publicUrl = file.publicUrl(); // Или формируем URL вручную если publicUrl не работает в этой версии

        // Формируем надежный публичный URL для Firebase Storage
        // const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        
        console.log(`  - Uploaded optimized: ${publicUrl}`);
        newImageUrls.push(publicUrl);
        hasChanges = true;

      } catch (err) {
        console.error(`  - Error processing image ${url}:`, err.message);
        // Если не удалось оптимизировать, оставляем старый URL, чтобы не сломать
        newImageUrls.push(url);
        errorCount++;
      }
    }

    // 4. Обновляем документ в Firestore, если были изменения
    if (hasChanges) {
      await doc.ref.update({ imageUrls: newImageUrls });
      console.log(`  -> Updated database for ${product.name}`);
      processedCount++;
    }
  }

  console.log('------------------------------------------------');
  console.log(`Optimization complete.`);
  console.log(`Products updated: ${processedCount}`);
  console.log(`Errors encountered: ${errorCount}`);
}

optimizeImages().catch(console.error);
