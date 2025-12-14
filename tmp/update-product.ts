import { getAdminDb } from '../lib/firebaseAdmin.ts';

const [,, docId = '1G4w3eInYj5TEu9YaTbw', androidUrl, iosUrl] = process.argv;

if (!androidUrl || !iosUrl) {
  console.error('Usage: tsx tmp/update-product.ts <docId> <androidGLBUrl> <iosUSDZUrl>');
  process.exit(1);
}

async function main() {
  const db = getAdminDb();
  await db.collection('products').doc(docId).set({
    model3dUrl: androidUrl,
    model3dIosUrl: iosUrl,
    has3D: true,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log('Обновлено');
}

main().catch((err) => {
  console.error('Ошибка обновления:', err);
  process.exit(1);
});
