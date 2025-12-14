import { getAdminStorage } from '../lib/firebaseAdmin.ts';

async function main() {
  const bucket = getAdminStorage().bucket();
  const [files] = await bucket.getFiles({ prefix: 'models/', maxResults: 20 });
  files.sort((a, b) => {
    const aTime = a.metadata?.updated ? new Date(a.metadata.updated).getTime() : 0;
    const bTime = b.metadata?.updated ? new Date(b.metadata.updated).getTime() : 0;
    return bTime - aTime;
  });
  files.slice(0, 10).forEach((file) => {
    console.log(file.name, file.metadata?.mediaLink || '');
  });
}

main().catch((err) => {
  console.error('Ошибка списка моделей:', err);
  process.exit(1);
});
