
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs/promises';
import path from 'path';

const serviceAccount = JSON.parse(await fs.readFile('serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'aura-mebel-7ec96.appspot.com'
});

const bucket = getStorage().bucket();
const cacheDir = '.next/dev/cache/images';

async function uploadImages() {
  try {
    const files = await fs.readdir(cacheDir, { recursive: true });
    const imageFiles = files.filter(file => /\.(webp|jpg|jpeg|png|svg|gif)$/.test(file));

    for (const file of imageFiles) {
      const localPath = path.join(cacheDir, file);
      const remotePath = `images/${path.basename(file)}`;
      
      try {
        const [metadata] = await bucket.file(remotePath).getMetadata();
        console.log(`File ${remotePath} already exists. Skipping.`);
        continue;
      } catch (error) {
        // file does not exist
      }
      
      console.log(`Uploading ${localPath} to ${remotePath}...`);

      await bucket.upload(localPath, {
        destination: remotePath,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      console.log(`Successfully uploaded ${remotePath}`);
    }
  } catch (error) {
    console.error('Error uploading images:', error);
  }
}

uploadImages();
