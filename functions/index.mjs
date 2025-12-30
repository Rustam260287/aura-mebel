import { onObjectFinalized } from 'firebase-functions/v2/storage';
import admin from 'firebase-admin';
import sharp from 'sharp';
import os from 'os';
import path from 'path';
import fs from 'node:fs/promises';

admin.initializeApp();

const BUCKET_NAME = 'aura-mebel-7ec96.firebasestorage.app';
const TARGET_FOLDERS = ['media/', 'objects/', 'products/']; // 'products/' kept for legacy uploads
const METADATA_FLAG = 'convertedToWebp';

export const convertMediaImagesToWebp = onObjectFinalized(
  { bucket: BUCKET_NAME, region: 'us-west1' },
  async (object) => {
    const { bucket: bucketName, name, contentType, metadata } = object;
    if (!bucketName || !name || !contentType) return;

    if (!TARGET_FOLDERS.some((prefix) => name.startsWith(prefix))) {
      return;
    }

    if (metadata?.[METADATA_FLAG] === 'true') {
      return;
    }

    if (!contentType.startsWith('image/')) {
      return;
    }

    // Already WebP — nothing to do.
    if (contentType === 'image/webp') {
      return;
    }

    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(name);
    const tmpFilePath = path.join(os.tmpdir(), path.basename(name));

    await file.download({ destination: tmpFilePath });

    try {
      const webpBuffer = await sharp(tmpFilePath)
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      await file.save(webpBuffer, {
        contentType: 'image/webp',
        metadata: {
          ...metadata,
          [METADATA_FLAG]: 'true',
        },
      });
    } finally {
      await fs.rm(tmpFilePath, { force: true });
    }
  }
);
