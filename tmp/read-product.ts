import { getAdminDb } from '../lib/firebaseAdmin.ts';

const targetId = process.argv[2] || '1G4w3eInYj5TEu9YaTbw';

async function main() {
  const db = getAdminDb();
  const doc = await db.collection('products').doc(targetId).get();
  if (!doc.exists) {
    console.error(`Документ ${targetId} не найден`);
    return;
  }
  console.log(JSON.stringify(doc.data(), null, 2));
}

main().catch((err) => {
  console.error('Ошибка чтения продукта:', err);
  if (err && err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});
