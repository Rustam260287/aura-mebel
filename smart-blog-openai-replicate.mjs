import fs from 'fs';
import path from 'path';
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
const DRY_RUN = process.env.DRY_RUN === '1';
const COLLECTION = DRY_RUN ? 'blog_test' : 'blog';
const STORAGE_PREFIX = DRY_RUN ? 'blog-test' : 'blog';

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

const dateStamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const slugify = (title) =>
  (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '') || `post-${Date.now()}`;

async function fetchExistingTitles(limit = 100) {
  const snapshot = await db.collection(COLLECTION).limit(limit).get();
  return snapshot.docs.map((d) => (d.data().title || '').toLowerCase());
}

async function fetchProductsSample(limit = 60) {
  if (DRY_RUN) return [];
  const snapshot = await db.collection('products').limit(limit).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    category: doc.data().category || '',
    price: doc.data().price || 0,
  }));
}

async function pickFreshTopic(existingTitles) {
  const sys = `Ты — редактор премиального журнала про интерьер. Дай 3 свежие темы с акцентом на мировые тренды (свет, материалы, формы, цвета). Ответом только JSON: {"topics":["...","...","..."]}`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: 'Выдай три темы на сегодня. Без повторов, премиум сегмент.' },
    ],
    temperature: 0.9,
  });
  const text = (resp.choices[0].message.content || '').replace(/```json|```/g, '').trim();
  let topics = [];
  try {
    topics = JSON.parse(text).topics || [];
  } catch (e) {
    topics = [];
  }
  const unique = topics.find((t) => !existingTitles.includes(t.toLowerCase()));
  return unique || topics[0] || 'Тихая роскошь: актуальный минимализм';
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
  "tags": ["Интерьер","Тренды"],
  "seoDescription": "до 150 знаков, с ключами по теме"
}`;
  const user = `Напиши статью на тему: "${topic}".
Стиль: изысканно, лаконично, практично; упоминай фактуру, свет, пропорции, мировые тренды.
Каталог товаров: ${catalogContext}
В контенте 2-3 раза вставь блок [PRODUCT: Название товара] после абзацев, где уместно.`;

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    temperature: 0.85,
  });

  let text = resp.choices[0].message.content || '{}';
  text = text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

async function generateHeroImage(title) {
  const seed = Math.floor(Math.random() * 1_000_000);
  const prompt = `magazine cover photo, luxury interior, ${title}, cinematic light, 4k, photorealistic, warm palette, brass accents, no text, no watermark`;
  const asciiPrompt = prompt.replace(/[^\x00-\x7F]/g, '');
  try {
    const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
      input: {
        prompt,
        width: 1200,
        height: 800,
        num_outputs: 1,
        output_format: 'png',
        safety_tolerance: 4,
        seed,
      },
    });
    // Replicate can return: array of urls, object with output, or stream
    if (typeof output === 'string') {
      return await downloadBuffer(output);
    }
    if (Array.isArray(output) && output[0]) {
      return await downloadBuffer(output[0]);
    }
    if (output && Array.isArray(output.output) && output.output[0]) {
      return await downloadBuffer(output.output[0]);
    }
    if (output?.getReader) {
      const reader = output.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(Buffer.from(value));
      }
      return Buffer.concat(chunks);
    }
    console.warn('Replicate unexpected output', output);
  } catch (e) {
    console.warn('Replicate failed, fallback to pollinations:', e.message || e);
  }
  const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(asciiPrompt)}?width=1200&height=800&nologo=true&seed=${seed}`;
  return await downloadBuffer(fallbackUrl, true);
}

async function downloadBuffer(url, quiet = false, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`status ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i === attempts - 1) {
        if (!quiet) console.error(`Failed to download image ${url}:`, e.message || e);
        throw e;
      }
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
}

async function uploadHero(buffer, slug) {
  if (DRY_RUN) {
    const outDir = path.join('tmp', 'blog-test');
    fs.mkdirSync(outDir, { recursive: true });
    const filePath = path.join(outDir, `${slug}-hero.png`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }
  const fileName = `${STORAGE_PREFIX}/${slug}-hero.png`;
  const file = bucket.file(fileName);
  await file.save(buffer, { contentType: 'image/png', public: true });
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

async function main() {
  console.log('🚀 Smart blog generator (OpenAI + Replicate), DRY_RUN=', DRY_RUN ? 'yes' : 'no');
  const existingTitles = await fetchExistingTitles(100);
  const topic = await pickFreshTopic(existingTitles);
  console.log('🧠 Topic:', topic);

  const catalog = await fetchProductsSample(80);

  try {
    const article = await generateArticle(topic, catalog);
    const slug = `${slugify(article.title)}-${dateStamp}`;
    const heroBuffer = await generateHeroImage(article.title);
    const imageUrl = await uploadHero(heroBuffer, slug);

    const doc = {
      ...article,
      id: slug,
      imageUrl,
      createdAt: new Date().toISOString(),
      status: 'published',
    };

    if (DRY_RUN) {
      const outDir = path.join('tmp', 'blog-test');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(doc, null, 2));
      console.log(`🧪 DRY-RUN saved: ${slug}`);
    } else {
      await db.collection(COLLECTION).doc(slug).set(doc);
      console.log(`✅ Published: ${article.title}`);
    }
  } catch (e) {
    console.error('❌ Ошибка генерации:', e.message || e);
  }

  console.log('🏁 Done.');
}

main();
