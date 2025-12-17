
import fs from 'fs';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Инициализация Firebase Admin
const serviceAccountPath = path.resolve('serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: serviceAccountKey.json not found in project root.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Функция очистки текста
function cleanDescription(text) {
  if (!text) return '';
  
  let clean = text;

  // 1. Убираем "Описание" в начале
  clean = clean.replace(/^Описание\s*/i, '');

  // 2. Убираем эмодзи и спецсимволы (расширенный набор)
  clean = clean.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{2B50}\u{200D}\u{FE0F}\u{2728}\u{26A1}\u{1F525}\u{2705}\u{274C}\u{203C}\u{2049}\u{00A9}\u{00AE}\u{2122}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu, '');
  
  // 3. Убираем маркетинговый шум (регистронезависимо)
  const marketingStopWords = [
      /!!!\s*АКЦИЯ\s*!!!/gi,
      /!!!\s*НОВИНКА\s*!!!/gi,
      /ТРЕНД СЕЗОНА/gi,
      /НОВИНКА\s*\d{4}/gi, 
      /✨/g, /⚡/g, /🔥/g, /✅/g, /⚜️/g, /▪️/g, /•/g, 
      /В НАЛИЧИИ!/gi, /АКЦИЯ!/gi,
      /Цена зависит от материала.*/gi, // Часто встречается и портит вид
      /Расцветка ткани и декора.*/gi,
      /По всей России/gi
  ];

  marketingStopWords.forEach(regex => {
      clean = clean.replace(regex, '');
  });

  // 4. Очистка структуры (пробелы, переносы)
  clean = clean
      .replace(/\r\n/g, '\n')       
      .replace(/\t/g, ' ')          
      .replace(/[ \t]+/g, ' ')      
      .replace(/\n\s*\n/g, '\n')    
      .trim();

  // 5. Фильтрация строк
  const lines = clean.split('\n');
  const filteredLines = lines
      .map(line => line.trim())
      .filter(line => {
          if (line.length < 2) return false;
          // Убираем строки, состоящие только из цифр или знаков препинания
          if (/^[^a-zA-Zа-яА-Я]+$/.test(line)) return false; 
          return true;
      });

  return filteredLines.join('\n');
}

// Функция извлечения характеристик
function parseSpecs(text) {
  const specs = {};
  if (!text) return specs;

  // Расширенные регулярки для поиска размеров
  // Ищем: "Ширина: 100", "Ш. 100", "Длина - 200", "В 50см"
  const patterns = [
      { key: 'width', regex: /(?:Ширина|Ш\.|Длина|Д\.|Ширина дивана|Длина дивана)[^0-9\n]*?(\d+(?:[.,]\d+)?)/i },
      { key: 'height', regex: /(?:Высота|В\.|Высота спинки|Высота дивана)[^0-9\n]*?(\d+(?:[.,]\d+)?)/i },
      { key: 'depth', regex: /(?:Глубина|Г\.|Глубина дивана|Глубина сидушки)[^0-9\n]*?(\d+(?:[.,]\d+)?)/i }
  ];

  patterns.forEach(({ key, regex }) => {
      const match = text.match(regex);
      if (match) {
          // Нормализуем число (заменяем запятую на точку)
          let val = match[1].replace(',', '.');
          specs[key] = val;
      }
  });

  return specs;
}

async function cleanAndUpload() {
  const inputFile = 'label-com-download/products.json'; // Используем исходный файл, он кажется самым полным по структуре
  if (!fs.existsSync(inputFile)) {
      console.error(`File not found: ${inputFile}`);
      return;
  }

  const rawData = fs.readFileSync(inputFile, 'utf8');
  const products = JSON.parse(rawData);
  console.log(`Loaded ${products.length} products. Starting cleanup...`);

  let updatedCount = 0;
  const batchSize = 400; // Firestore batch limit is 500
  let batch = db.batch();
  let operationCount = 0;

  for (const product of products) {
    if (!product.originalUrl) continue;

    const cleanDesc = cleanDescription(product.description);
    const specs = parseSpecs(product.description); // Парсим из "грязного", там данные точнее

    // Подготовка данных для обновления
    // Мы ищем документ по originalUrl, чтобы не дублировать
    const snapshot = await db.collection('products')
      .where('originalUrl', '==', product.originalUrl)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      batch.update(docRef, {
          description: cleanDesc,
          specs: specs,
          // Можно также обновить имя, убрав лишнее (например "Спальни : Агата" -> "Агата")
          name: product.name.replace(/^.*:\s*/, '').trim() 
      });
      updatedCount++;
      operationCount++;
    } 
    // Если товара нет, можно было бы создать, но мы договорились "чистить", а не импортировать новое.

    if (operationCount >= batchSize) {
        await batch.commit();
        console.log(`Committed batch of ${operationCount} updates.`);
        batch = db.batch();
        operationCount = 0;
    }
  }

  if (operationCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${operationCount} updates.`);
  }

  console.log(`\nCleanup finished. Updated ${updatedCount} products.`);
}

cleanAndUpload().catch(console.error);
