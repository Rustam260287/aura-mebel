import fs from 'fs';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import Replicate from 'replicate';

dotenv.config({ path: '.env.local' });

// --- CONFIG ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';
const BUCKET_NAME = 'aura-mebel-7ec96.firebasestorage.app';

if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY не задан в .env.local');
if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN не задан в .env.local');

// --- FIREBASE INIT ---
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: BUCKET_NAME,
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// --- CLIENTS ---
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

// --- TOPICS (мировые тренды) ---
const topics = [
  'Новый минимализм 2025: тихая роскошь, тактильные фактуры, бежево-карамельная палитра',
  'Биофилия и натуральные материалы: камень, массив, лен и травертин в жилых интерьерах',
  'Японди и сканди-лукс: как смешивать лаконичность, тёплое дерево и мягкий текстиль',
  'Трендовые гостиные: модульные диваны, радиусные формы, низкие столы, арт-объекты',
  'Ар-деко 2.0: латунь, графит, изумруд и приглушённые винтажные оттенки',
  'Свет как декор: многоуровневые сценарии, магнитные треки, акцентные бра и подсветка текстур',
];

const slugify = (title) =>
  (title || '')
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
  const sys = `Ты — главный редактор премиального журнала о дизайне интерьера (уровень AD / Elle Decor).
Формат ответа: чистый JSON.
Структура JSON:
{
  "title": "...",
  "excerpt": "...",
  "content": "<h2>...</h2><p>...</p> ... HTML с 2-3 блоками [PRODUCT: Название]",
  "author": "Labelcom Design",
  "tags": ["Интерьер","Тренды"]
}`;
  const user = `Напиши статью на тему: "${topic}".
Стиль: изысканно, лаконично, практично; упоминай фактуру, свет, пропорции.
Каталог товаров: ${catalogContext}
В контенте 2-3 раза вставь блок [PRODUCT: Название товара] после абзацев, где уместно.`;

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    temperature: 0.8,
  });

  let text = resp.choices[0].message.content || '{}';
  text = text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

async function generateHeroImage(title) {
  const prompt = `magazine cover photo, luxury interior, ${title}, cinematic light, 4k, photorealistic, warm palette, brass accents, no text, no watermark`;
  const modelId = 'black-forest-labs/flux-1.1-pro';
  try {
    const output = await replicate.run(modelId, {
      input: {
        prompt,
        width: 1200,
        height: 800,
        num_outputs: 1,
        output_format: 'png',
        safety_tolerance: 4,
      },
    });
    // Replicate may return array or object with output array
    if (Array.isArray(output) && output[0]) return output[0];
    if (output && Array.isArray(output.output) && output.output[0]) return output.output[0];
    console.warn('Replicate returned unexpected output', output);
  } catch (e) {
    console.warn('Replicate failed, fallback to pollinations:', e.message || e);
  }
  // Fallback to a deterministic external generator to keep pipeline green in DRY_RUN
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=800&nologo=true`;
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadHero(buffer, slug) {
  const fileName = `blog/${slug}-hero.png`;
  const file = bucket.file(fileName);
  await file.save(buffer, { contentType: 'image/png', public: true });
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

async function main() {
  console.log('🚀 Генерация статей (OpenAI) + обложек (Replicate)...');
  const catalog = await fetchProductsSample(80);

  for (const topic of topics) {
    try {
      const article = await generateArticle(topic, catalog);
      const slug = slugify(article.title);
      const heroUrl = await generateHeroImage(article.title);
      const buffer = await downloadBuffer(heroUrl);
      const imageUrl = await uploadHero(buffer, slug);

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
      console.error(`❌ Ошибка по теме "${topic}":`, e.message || e);
    }
  }

  console.log('🏁 Готово.');
}

main();
