import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

const DATA_FILE = 'label-com-download/products.json';
const IMAGES_ROOT = 'label-com-download/images';

const toPosix = (p) => p.split(path.sep).join('/');

async function hashFile(filePath) {
  const data = await fs.readFile(filePath);
  return createHash('sha1').update(data).digest('hex');
}

async function dedupeProduct(product) {
  const dir = path.join(IMAGES_ROOT, product.slug);
  let files;
  try {
    files = (await fs.readdir(dir)).sort();
  } catch {
    return { kept: 0, removed: 0 };
  }

  const seen = new Map();
  const keep = [];
  const remove = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const hash = await hashFile(fullPath);
    if (seen.has(hash)) {
      remove.push(fullPath);
    } else {
      seen.set(hash, fullPath);
      keep.push(file);
    }
  }

  // Delete duplicates
  await Promise.all(remove.map((file) => fs.rm(file)));

  // Update localImages to kept files only
  product.localImages = keep.map((file) =>
    toPosix(path.join('images', product.slug, file))
  );

  return { kept: keep.length, removed: remove.length };
}

async function main() {
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  const products = JSON.parse(raw);

  let totalRemoved = 0;
  let totalKept = 0;

  for (const product of products) {
    const { kept, removed } = await dedupeProduct(product);
    totalKept += kept;
    totalRemoved += removed;
  }

  await fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2));

  console.log(`✅ Удалено дубликатов: ${totalRemoved}`);
  console.log(`📦 Итоговых файлов: ${totalKept}`);
}

main().catch((err) => {
  console.error('Сбой дедупликации:', err);
  process.exit(1);
});
