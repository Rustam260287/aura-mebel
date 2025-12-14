import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;
const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';
const BUCKET_NAME = 'aura-mebel-7ec96.firebasestorage.app';

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY не задан в .env.local');
}
if (!HF_TOKEN) {
  throw new Error('HF_TOKEN не задан в .env.local');
}

// Firebase init
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: BUCKET_NAME,
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// AI clients
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: { responseMimeType: 'application/json' },
});
const hf = new HfInference(HF_TOKEN);

// Темы: актуальные мировые тренды
const topics = [
  'Новый минимализм 2025: тихая роскошь, тактильные фактуры, бежево-карамельная палитра',
  'Биофилия и натуральные материалы: камень, массив, лен и травертин в жилых интерьерах',
  'Японди и сканди-лукс: как смешивать лаконичность, тёплое дерево и мягкий текстиль',
  'Трендовые гостиные: модульные диваны, радиусные формы, низкие столы, арт-объекты',
  'Ар-деко 2.0: латунь, графит, изумруд и приглушённые винтажные оттенки в современном исполнении',
  'Свет как декор: многоуровневые сценарии, магнитные треки, акцентные бра и подсветка текстур',
];

const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '') || `post-${Date.now()}`;

async function fetchProductsSample(limit = 80) {
  const snapshot = await db.collection('products').limit(limit).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    category: doc.data().category || '',
    price: doc.data().price || 0,
  }));
}

async function generateArticle(topic, catalog) {
  const catalogContext = JSON.stringify(catalog.slice(0, 60));
  const prompt = `
    Ты — главный редактор премиального журнала о мебели и дизайне (уровень AD).
    Напиши статью на тему "${topic}".
    Формат JSON строго:
    {
      "title": "заголовок",
      "excerpt": "лид 2-3 предложения",
      "content": "HTML со структурой: <p>, <h2>, <ul>, <li>, <blockquote>. Вставляй 2-3 блока [PRODUCT: Название]",
      "author": "Labelcom Design",
      "tags": ["Интерьер","Тренды"]
    }
    Каталог для привязки товаров: ${catalogContext}
    Стиль: изысканно, лаконично, практично. Указывай фактуру, свет, пропорции.
  `;

  const result = await model.generateContent(prompt);
  const json = JSON.parse(result.response.text());
  return json;
}

async function generateHeroImage(title) {
  const prompt = `magazine cover photo, luxury interior, ${title}, cinematic light, 4k, photorealistic, warm, wooden textures, brass accents`;
  const blob = await hf.textToImage({
    model: 'stabilityai/stable-diffusion-xl-base-1.0',
    inputs: prompt,
    parameters: { negative_prompt: 'blurry, lowres, watermark, text' },
  });
  return Buffer.from(await blob.arrayBuffer());
}

async function uploadHero(buffer, slug) {
  const fileName = `blog/${slug}-hero.webp`;
  const file = bucket.file(fileName);
  await file.save(buffer, { contentType: 'image/webp', public: true });
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

async function main() {
  console.log('🚀 Генерация статей...');
  const catalog = await fetchProductsSample(80);

  for (const topic of topics) {
    try {
      const article = await generateArticle(topic, catalog);
      const slug = slugify(article.title);
      const heroBuffer = await generateHeroImage(article.title);
      const imageUrl = await uploadHero(heroBuffer, slug);

      const doc = {
        ...article,
        id: slug,
        imageUrl,
        createdAt: new Date().toISOString(),
        status: 'published',
      };

      await db.collection('blog').doc(slug).set(doc);
      console.log(`✅ ${article.title}`);
    } catch (e) {
      console.error(`❌ Ошибка "${topic}":`, e.message || e);
    }
  }

  console.log('🏁 Готово.');
}

main();
