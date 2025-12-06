#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import admin from 'firebase-admin';

dotenv.config({ path: '.env.local' });

const DRY_RUN = process.env.DRY_RUN === '1';
const BATCH_LIMIT = Number(process.env.BATCH_LIMIT || 50); // сколько товаров обновлять за раз
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'serviceAccountKey.json';

if (!admin.apps.length) {
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Service account file not found:', serviceAccountPath);
    process.exit(1);
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

const db = admin.firestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const outDir = path.join(process.cwd(), 'tmp', 'product-content');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function buildPrompt(prod) {
  const existingSpecs = prod.specs || prod.details || {};
  const facts = {
    name: prod.name,
    category: prod.category,
    price: prod.price,
    description: (prod.description || prod.description_main || '').replace(/\s+/g, ' ').trim(),
    details: prod.details || {},
    materials: prod.materials || prod.material || '',
    dimensions: prod.dimensions || (prod.details && prod.details.dimensions) || '',
    color: prod.color || '',
    country: prod.country || '',
    warranty: prod.warranty || '',
    existingSpecs,
  };

  return `
Ты пишешь контент для премиального мебельного бутика. Работай строго с фактами, которые я дал. Не выдумывай размеры, материалы или механизмы, если их нет.
Если характеристика уже есть в existingSpecs — сохрани ее (повтори), не затирай "уточните у консультанта".

ФАКТЫ О ТОВАРЕ:
${JSON.stringify(facts, null, 2)}

Нужно вернуть JSON:
{
  "lead": "1-2 предложения, без воды, про ценность/стиль/материал",
  "bullets": ["3-5 пунктов, главное: материалы, конструкция, комфорт/эргономика, стиль, уход (если есть факты)"],
  "seoDescription": "500-700 символов, без цен/доставки, уникальный текст на основе фактов",
  "specs": {
    "Габариты (Ш×Г×В)": "...",
    "Посадочная высота": "...",
    "Посадочная глубина": "...",
    "Каркас": "...",
    "Обивка": "...",
    "Наполнитель": "...",
    "Ножки": "...",
    "Механизм": "...",
    "Съёмные чехлы": "...",
    "Нагрузка": "...",
    "Стиль": "...",
    "Цвет": "...",
    "Страна": "...",
    "Гарантия": "..."
  }
}
Если данных нет — пиши "уточните у консультанта". Не упоминай цену.`;
}

async function improveProduct(prod) {
  const prompt = buildPrompt(prod);
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Ты — контент-редактор премиального мебельного бутика.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.6,
    max_tokens: 800,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error('Empty response');
  return JSON.parse(text);
}

function mergeSpecs(existing, generated) {
  const fields = [
    "Габариты (Ш×Г×В)",
    "Посадочная высота",
    "Посадочная глубина",
    "Каркас",
    "Обивка",
    "Наполнитель",
    "Ножки",
    "Механизм",
    "Съёмные чехлы",
    "Нагрузка",
    "Стиль",
    "Цвет",
    "Страна",
    "Гарантия",
  ];

  const isUnknown = (v) => !v || v.toLowerCase() === 'уточните у консультанта';

  const merged = {};
  for (const key of fields) {
    const existingVal = existing?.[key];
    const genVal = generated?.[key];

    if (!isUnknown(existingVal)) {
      merged[key] = existingVal;
    } else if (!isUnknown(genVal)) {
      merged[key] = genVal;
    } else {
      merged[key] = 'уточните у консультанта';
    }
  }
  return merged;
}

async function main() {
  console.log(`🚀 Улучшаем карточки. DRY_RUN=${DRY_RUN ? 'yes' : 'no'} BATCH_LIMIT=${BATCH_LIMIT}`);

  const snapshot = await db.collection('products').limit(BATCH_LIMIT).get();
  const products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log(`Найдено ${products.length} товаров для обработки`);

  let processed = 0;
  for (const prod of products) {
    try {
      const enhanced = await improveProduct(prod);
      const mergedSpecs = mergeSpecs(prod.specs || prod.details || {}, enhanced.specs || {});
      const payload = {
        description: enhanced.lead,
        seoDescription: enhanced.seoDescription,
        bullets: enhanced.bullets,
        specs: mergedSpecs,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (DRY_RUN) {
        fs.writeFileSync(path.join(outDir, `${prod.id}.json`), JSON.stringify({ src: prod, enhanced: payload }, null, 2));
      } else {
        await db.collection('products').doc(prod.id).set(payload, { merge: true });
      }

      processed += 1;
      if (processed % 10 === 0) console.log(`Готово ${processed}/${products.length}`);
    } catch (err) {
      console.error(`Ошибка на ${prod.id}:`, err.message);
    }
  }

  console.log(`✅ Завершено. Обработано ${processed} товаров.`);
  if (DRY_RUN) console.log(`Результаты: ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
