
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// --- Инициализация Firebase ---
try {
  const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
  // ИСПРАВЛЕНИЕ: Используем правильный формат имени bucket
  const BUCKET_NAME = `${serviceAccount.project_id}.appspot.com`;

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: BUCKET_NAME
    });
  }
} catch (error) {
    console.error("❌ Ошибка инициализации Firebase. Убедитесь, что файл serviceAccountKey.json существует и корректен.", error);
    process.exit(1);
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// --- Основная функция ---
async function uploadLocalModel(productId, fileName) {
  if (!productId || !fileName) {
    console.error('❌ ОШИБКА: ID объекта и имя файла должны быть указаны.');
    return;
  }

  const localPath = join('uploads', fileName);
  if (!existsSync(localPath)) {
    console.error(`❌ ОШИБКА: Файл не найден по пути: ${localPath}`);
    console.error('Пожалуйста, убедитесь, что вы положили файл в папку /uploads в корне проекта.');
    return;
  }

  console.log(`🚀 Начинаю загрузку модели '${fileName}' для объекта '${productId}'...`);

  const timestamp = new Date().getTime();
  const storagePath = `models/local/${productId}_${timestamp}.glb`;
  const file = bucket.file(storagePath);

  try {
    // 1. Загрузка файла в Firebase Storage
    console.log(`   📤 Загружаю в Storage как '${storagePath}'...`);
    await file.save(readFileSync(localPath), {
      metadata: { 
          contentType: 'model/gltf-binary',
          cacheControl: 'public, max-age=31536000'
        }
    });

    // 2. Получение подписанной ссылки (Signed URL)
    console.log('   🔗 Создаю подписанную ссылку (Signed URL)...');
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2125'
    });

    // 3. Обновление документа объекта в Firestore
    console.log(`   📄 Обновляю объект в Firestore...`);
    await db.collection('products').doc(productId).update({
      modelGlbUrl: signedUrl,
      has3D: true,
      modelSource: 'local_upload'
    });

    console.log('✅ Готово! Модель успешно загружена и привязана к объекту.');
    console.log(`   📦 ID объекта: ${productId}`);
    console.log(`   🔗 Новая ссылка на модель: ${signedUrl}`);

  } catch (error) {
    console.error('❌ Произошла ошибка при загрузке:', error.message);
  }
}

// --- Запуск через аргументы командной строки ---
const args = process.argv.slice(2);
const productIdArg = args[0];
const fileNameArg = args[1];

if (!productIdArg || !fileNameArg) {
    console.log("ИСПОЛЬЗОВАНИЕ: node scripts/upload_local_model.mjs <ID_ОБЪЕКТА> <ИМЯ_ФАЙЛА>");
    console.log("Пример: node scripts/upload_local_model.mjs K76YLoU4Co4T4RkF9xJG \"my_model.glb\"");
} else {
    uploadLocalModel(productIdArg, fileNameArg);
}
