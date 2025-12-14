import { getAdminDb } from '../lib/firebaseAdmin.ts';

async function main() {
  const db = getAdminDb();
  const snapshot = await db.collection('products').where('has3D', '==', true).limit(10).get();
  if (snapshot.empty) {
    console.log('Нет товаров с has3D=true');
    return;
  }
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(doc.id, data.name, data.model3dUrl, data.model3dIosUrl);
  });
}

main().catch(err => {
  console.error('Ошибка списка 3D товаров:', err);
  process.exit(1);
});
