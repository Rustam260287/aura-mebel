import admin from 'firebase-admin';
import fs from 'fs/promises';
import path from 'path';

const SERVICE_ACCOUNT_FILE = 'serviceAccountKey.json';
const DATA_FILE = 'label-com-download/products.json';
const BUCKET_NAME = 'aura-mebel-7ec96.firebasestorage.app';
const DEST_PREFIX = 'products/label-com';

function getContentType(ext) {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

function slugFromUrl(originalUrl) {
  const match = originalUrl.match(/\/([^/]+)-detail\.html/i);
  return match ? match[1] : null;
}

async function main() {
  const serviceAccount = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_FILE, 'utf8'));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: BUCKET_NAME,
    });
  }

  const bucket = admin.storage().bucket();
  const db = admin.firestore();

  const labelProducts = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  const byOriginal = new Map(labelProducts.map((p) => [p.originalUrl, p]));
  const bySlug = new Map(labelProducts.map((p) => [p.slug, p]));

  const snapshot = await db.collection('products').get();
  console.log(`Scanning ${snapshot.size} products...`);

  let updated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const originalUrl = data.originalUrl;
    if (!originalUrl) {
      console.warn(`Skipping ${doc.id} (${data.name || 'без имени'}): нет originalUrl`);
      skipped++;
      continue;
    }

    const slug = slugFromUrl(originalUrl);
    const localProduct = byOriginal.get(originalUrl) || (slug ? bySlug.get(slug) : null);
    if (!localProduct || !localProduct.localImages?.length) {
      console.warn(`No local image for ${doc.id} (${data.name || slug || 'unknown'})`);
      skipped++;
      continue;
    }

    const localRelPath = localProduct.localImages[0];
    const localPath = path.join('label-com-download', localRelPath);
    const ext = path.extname(localPath) || '.jpg';
    const contentType = getContentType(ext);
    const destination = `${DEST_PREFIX}/${doc.id}${ext}`;

    console.log(`Uploading image for ${data.name || slug} -> ${destination}`);
    await bucket.upload(localPath, {
      destination,
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
      public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
    await doc.ref.update({ imageUrls: [publicUrl] });
    updated++;
  }

  console.log(`Done. Updated: ${updated}. Skipped: ${skipped}.`);
}

main().catch((err) => {
  console.error('Failed to refresh images:', err);
  process.exit(1);
});
