import { getAdminStorage } from '../lib/firebaseAdmin.ts';

const pathArg = process.argv[2];
if (!pathArg) {
  console.error('Usage: tsx tmp/get-download-url.ts <storagePath>');
  process.exit(1);
}

async function main() {
  const storage = getAdminStorage();
  const file = storage.bucket().file(pathArg);
  const [metadata] = await file.getMetadata();
  const token = metadata.metadata?.firebaseStorageDownloadTokens;

  if (!token) {
    console.log('Файл не содержит токена, формирую подписанный URL на сутки...');
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24,
    });
    console.log(signedUrl);
    return;
  }

  const encoded = encodeURIComponent(pathArg);
  const url = `https://firebasestorage.googleapis.com/v0/b/aura-mebel-7ec96.firebasestorage.app/o/${encoded}?alt=media&token=${token}`;
  console.log(url);
}

main().catch((err) => {
  console.error('Ошибка получения URL:', err);
  process.exit(1);
});
