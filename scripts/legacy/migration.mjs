
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fetch from 'node-fetch';
import { firebaseConfig } from './firebase-config.js';

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function migrateImages() {
  const productsCollection = collection(db, 'products');
  const productSnapshot = await getDocs(productsCollection);

  for (const productDoc of productSnapshot.docs) {
    const productData = productDoc.data();
    const newImageUrls = [];

    if (productData.imageUrls && productData.imageUrls.length > 0) {
      console.log(`Миграция изображений для товара: ${productData.name}`);
      for (const imageUrl of productData.imageUrls) {
        if (imageUrl.startsWith('https://label-com.ru')) {
          try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
              throw new Error(`Не удалось загрузить изображение: ${imageUrl}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);
            const imageName = imageUrl.split('/').pop();
            const storageRef = ref(storage, `product-images/${imageName}`);
            
            await uploadBytes(storageRef, imageBuffer, {
              contentType: response.headers.get('content-type')
            });

            const downloadURL = await getDownloadURL(storageRef);
            newImageUrls.push(downloadURL);
            console.log(`  - Изображение успешно перенесено: ${downloadURL}`);
          } catch (error) {
            console.error(`  - Ошибка при миграции изображения ${imageUrl}:`, error);
            // Если изображение не удалось перенести, сохраняем старый URL
            newImageUrls.push(imageUrl);
          }
        } else {
          // Если URL не со старого сайта, просто сохраняем его
          newImageUrls.push(imageUrl);
        }
      }

      // Обновляем документ товара с новыми URL изображений
      const productRef = doc(db, 'products', productDoc.id);
      await updateDoc(productRef, { imageUrls: newImageUrls });
      console.log(`Товар "${productData.name}" обновлен с новыми URL изображений.`);
    }
  }

  console.log('\nМиграция изображений завершена!');
}

migrateImages().catch(console.error);
