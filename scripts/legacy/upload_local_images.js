
import fs from 'fs/promises';
import path from 'path';
import { getAdminDb, getAdminStorage } from './lib/firebaseAdmin.js';
import { randomUUID } from 'crypto';

const BASE_LOCAL_PATH = 'label-com-download'; // Папка, где лежит products.json и папка images

async function uploadLocalImages() {
  console.log('Connecting to Firestore...');
  const db = getAdminDb();
  const bucket = getAdminStorage().bucket();
  const productsRef = db.collection('products');

  // 1. Читаем JSON с локальными путями
  const jsonPath = path.join(BASE_LOCAL_PATH, 'products.json');
  console.log(`Reading local product data from ${jsonPath}...`);
  
  let localProducts;
  try {
    const data = await fs.readFile(jsonPath, 'utf-8');
    localProducts = JSON.parse(data);
  } catch (e) {
    console.error(`Failed to read products.json: ${e.message}`);
    console.log("Make sure 'label-com-download/products.json' exists.");
    return;
  }

  console.log(`Found ${localProducts.length} products in JSON.`);

  // 2. Получаем текущие товары из базы, чтобы найти совпадения
  const snapshot = await productsRef.get();
  const firestoreProducts = new Map(); // Map<Name, DocID>
  snapshot.forEach(doc => {
      firestoreProducts.set(doc.data().name.trim(), doc.id);
  });

  let updatedCount = 0;
  let errorCount = 0;

  for (const item of localProducts) {
      const docId = firestoreProducts.get(item.name.trim());
      
      if (!docId) {
          console.log(`Product not found in Firestore: ${item.name} (skipping)`);
          continue;
      }

      if (!item.localImages || item.localImages.length === 0) {
          continue;
      }

      console.log(`Processing ${item.name} (${docId})...`);
      const newImageUrls = [];
      let hasUpdates = false;

      for (const localRelPath of item.localImages) {
          // localRelPath пример: "images/model-relaks/01.jpeg"
          // Полный путь: label-com-download/images/model-relaks/01.jpeg
          const fullPath = path.join(BASE_LOCAL_PATH, localRelPath);
          
          try {
              // Проверяем существование файла
              await fs.access(fullPath);
              
              // Читаем файл
              const buffer = await fs.readFile(fullPath);
              
              // Загружаем в Storage
              const ext = path.extname(fullPath);
              const filename = `products/${docId}/${randomUUID()}${ext}`;
              const file = bucket.file(filename);

              await file.save(buffer, {
                  metadata: {
                      contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
                      cacheControl: 'public, max-age=31536000',
                  }
              });

              await file.makePublic();
              // const publicUrl = file.publicUrl(); // Иногда возвращает не то
              const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
              
              console.log(`  - Uploaded: ${localRelPath} -> ${publicUrl}`);
              newImageUrls.push(publicUrl);
              hasUpdates = true;

          } catch (e) {
              console.error(`  - Failed to upload ${localRelPath}: ${e.message}`);
              errorCount++;
          }
      }

      if (hasUpdates && newImageUrls.length > 0) {
          // Обновляем документ. 
          // ВАЖНО: Мы перезаписываем imageUrls, так как старые могли быть битыми.
          // Если вы хотите добавить, используйте arrayUnion, но лучше перезаписать чистыми.
          await productsRef.doc(docId).update({ imageUrls: newImageUrls });
          console.log(`  -> Updated Firestore for ${item.name}`);
          updatedCount++;
      }
  }

  console.log('------------------------------------------------');
  console.log(`Upload complete.`);
  console.log(`Products updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
}

uploadLocalImages().catch(console.error);
