
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';

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

function cleanPremiumDescription(text) {
  if (!text) return '';
  
  let clean = text;

  // 1. Убираем "Описание" в начале
  clean = clean.replace(/^Описание\s*/i, '');

  // 2. Убираем эмодзи и спецсимволы
  // Диапазоны для большинства эмодзи
  clean = clean.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{2B50}\u{200D}\u{FE0F}\u{2728}\u{26A1}\u{1F525}]/gu, '');
  
  // 3. Убираем маркетинговый шум (регистронезависимо)
  const marketingStopWords = [
      /!!!\s*АКЦИЯ\s*!!!/gi,
      /!!!\s*НОВИНКА\s*!!!/gi,
      /ТРЕНД СЕЗОНА/gi,
      /НОВИНКА\s*\d{4}/gi, // НОВИНКА 2025
      /✨/g,
      /⚡/g,
      /🔥/g,
      /✅/g,
      /⚜️/g,
      /▪️/g,
      /•/g, // Буллиты заменим на новую строку или просто уберем, если они в начале
  ];

  marketingStopWords.forEach(regex => {
      clean = clean.replace(regex, '');
  });

  // 4. Очистка структуры
  clean = clean
      .replace(/\r\n/g, '\n')       // Нормализация переносов
      .replace(/\t/g, ' ')          // Табы в пробелы
      .replace(/[ \t]+/g, ' ')      // Множественные пробелы в один
      .replace(/\n\s*\n/g, '\n')    // Двойные пустые строки в одну
      .replace(/^\s+|\s+$/g, '');   // Trim

  // 5. Убираем строки, которые стали пустыми или содержат только спецсимволы после очистки
  const lines = clean.split('\n');
  const filteredLines = lines
      .map(line => line.trim())
      .filter(line => {
          // Убираем строки типа "В комплекте:", если дальше ничего нет (простая эвристика)
          if (line.length < 2) return false;
          // Убираем строки состоящие только из знаков препинания
          if (/^[^a-zA-Zа-яА-Я0-9]+$/.test(line)) return false;
          return true;
      });

  return filteredLines.join('\n');
}

function parseSpecs(text) {
  const specs = {};
  if (!text) return specs;

  // Регулярки для поиска размеров (более гибкие)
  const patterns = [
      { key: 'width', regex: /(?:Ширина|Ш\.|Длина|Д\.|Ширина дивана|Длина дивана)[^0-9]*([\d.,]+)/i },
      { key: 'height', regex: /(?:Высота|В\.|Высота спинки|Высота дивана)[^0-9]*([\d.,]+)/i },
      { key: 'depth', regex: /(?:Глубина|Г\.|Глубина дивана)[^0-9]*([\d.,]+)/i }
  ];

  patterns.forEach(({ key, regex }) => {
      const match = text.match(regex);
      if (match) {
          // Очищаем значение от лишних точек в конце (например "1.20.")
          let val = match[1].replace(/\.$/, '');
          specs[key] = val;
      }
  });

  return specs;
}

async function updateProducts() {
  const productsPath = 'label-com-download/products.json';
  if (!fs.existsSync(productsPath)) {
      console.error(`File not found: ${productsPath}`);
      return;
  }

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  console.log(`Loaded ${products.length} products from JSON.`);

  let updatedCount = 0;

  for (const [index, product] of products.entries()) {
    if (!product.originalUrl) continue;

    // Сначала парсим характеристики из "грязного" текста, так как там они точнее
    const specs = parseSpecs(product.description);
    
    // Затем чистим описание
    const premiumDescription = cleanPremiumDescription(product.description);

    // Ищем товар
    const snapshot = await db.collection('products')
      .where('originalUrl', '==', product.originalUrl)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({
          description: premiumDescription,
          specs: specs
      });
      updatedCount++;
    } else {
        // Fallback: try by name
        const nameSnapshot = await db.collection('products')
            .where('name', '==', product.name)
            .limit(1)
            .get();
        
        if (!nameSnapshot.empty) {
             const doc = nameSnapshot.docs[0];
             await doc.ref.update({
                description: premiumDescription,
                specs: specs
            });
            updatedCount++;
        }
    }
    
    if (index % 50 === 0) process.stdout.write('.');
  }

  console.log(`\nUpdated ${updatedCount} products with premium descriptions.`);
}

updateProducts().catch(console.error);
