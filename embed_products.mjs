import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) return admin.app();

  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error('serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT not set');
    }
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};

const getAdminDb = () => {
  if (admin.apps.length === 0) initializeFirebaseAdmin();
  return admin.firestore();
};

const normalizeText = (val = '') => (val || '').toString().replace(/\s+/g, ' ').trim();

const buildTextForEmbedding = (p) => {
  const tags = [
    ...(Array.isArray(p.tags) ? p.tags : []),
    ...(Array.isArray(p.styleTags) ? p.styleTags : []),
    ...(Array.isArray(p.materialTags) ? p.materialTags : []),
    ...(Array.isArray(p.colorTags) ? p.colorTags : []),
    ...(Array.isArray(p.formTags) ? p.formTags : []),
  ].join(', ');

  return [
    `Название: ${normalizeText(p.name)}`,
    `Категория: ${normalizeText(p.category)}`,
    `Теги: ${tags}`,
    `Описание: ${normalizeText(p.description || p.description_main || '')}`,
  ].join('\n');
};

async function embedProducts() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required to generate embeddings.');
  }

  const db = getAdminDb();
  const snapshot = await db.collection('products').get();
  console.log(`Embedding ${snapshot.size} products...`);

  const BATCH_SIZE = 20;
  let updated = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const text = buildTextForEmbedding(data);

    const resp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 2000),
    });

    const embedding = resp.data?.[0]?.embedding;
    if (embedding && Array.isArray(embedding)) {
      batch.update(doc.ref, { embedding });
      updated += 1;
      ops += 1;
    }

    if (ops >= BATCH_SIZE) {
      await batch.commit();
      console.log(`Committed batch, updated ${updated} so far...`);
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(`Done. Updated ${updated} products with embeddings.`);
}

embedProducts().catch((err) => {
  console.error('Embedding error:', err);
  process.exit(1);
});
