
import admin from 'firebase-admin';
import Replicate from 'replicate';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import fetch from 'node-fetch';

dotenv.config();

const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

// Правильное имя бакета: project_id.appspot.com (по умолчанию)
const BUCKET_NAME = `${serviceAccount.project_id}.firebasestorage.app`; 

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: BUCKET_NAME
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const DRY_RUN = false; 
const LIMIT = 5; // Увеличим лимит, чтобы обновить текущие

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runWithRetry(fn, retries = 3, delay = 15000) {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0 && (error.message.includes('429') || error.message.includes('503'))) {
            console.log(`   ⏳ Rate limit. Waiting ${delay/1000}s...`);
            await sleep(delay);
            return runWithRetry(fn, retries - 1, delay * 1.5);
        }
        throw error;
    }
}

async function uploadToStorage(url, destination) {
    let buffer;
    if (typeof url === 'object' && url.blob) {
         const blob = await url.blob();
         buffer = await blob.arrayBuffer();
    } else if (typeof url === 'string') {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch generated file: ${res.statusText}`);
        buffer = await res.arrayBuffer();
    } else {
        const streamChunks = [];
        for await (const chunk of url) {
            streamChunks.push(chunk);
        }
        buffer = Buffer.concat(streamChunks);
    }
    
    const file = bucket.file(destination);
    await file.save(Buffer.from(buffer), { 
        metadata: { contentType: 'model/gltf-binary' } 
    });
    
    // Генерируем Signed URL (действует 100 лет)
    const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2125'
    });

    return signedUrl;
}

async function outputToDataUri(output) {
    let buffer;
    if (typeof output === 'string' && output.startsWith('http')) {
        const res = await fetch(output);
        buffer = await res.arrayBuffer();
    } else if (output instanceof ReadableStream || (typeof output === 'object' && output.getReader)) {
         const blob = await new Response(output).blob();
         buffer = await blob.arrayBuffer();
    } else {
         const chunks = [];
         for await (const chunk of output) {
             chunks.push(chunk);
         }
         buffer = Buffer.concat(chunks);
    }
    return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
}

async function processProduct(doc) {
    const product = doc.data();
    const productId = doc.id;
    
    console.log(`\n📦 Processing: ${product.name} (${productId})`);

    // ЕСЛИ УЖЕ ЕСТЬ МОДЕЛЬ, НО ССЫЛКА СТАРАЯ (не Signed URL) - ОБНОВЛЯЕМ
    // Signed URL обычно длинный и содержит 'X-Goog-Algorithm'
    if (product.model3dUrl && product.model3dUrl.includes('X-Goog-Algorithm')) {
        console.log(`   ⏭️ Skipped: Already has valid 3D model`);
        return;
    }

    // Если модели нет или ссылка старая - генерируем заново (или переподписываем, если файл есть)
    // Для простоты генерируем заново, чтобы гарантировать свежесть
    
    const imageUrl = product.imageUrls?.[0];
    if (!imageUrl) {
        console.log(`   ⚠️ Skipped: No image found`);
        return;
    }

    try {
        console.log(`   🎨 Removing background...`);
        const rembgModel = await replicate.models.get("cjwbw", "rembg");
        const rembgVersion = rembgModel.latest_version.id;
        
        const rembgOutput = await runWithRetry(() => replicate.run(`cjwbw/rembg:${rembgVersion}`, {
            input: { image: imageUrl }
        }));
        
        const cleanImageDataUri = await outputToDataUri(rembgOutput);
        
        console.log(`   🧊 Generating 3D model (camenduru/tripo-sr)...`);
        
        const tripoModel = await replicate.models.get("camenduru", "tripo-sr");
        const tripoVersion = tripoModel.latest_version.id;
        
        const modelOutput = await runWithRetry(() => replicate.run(`camenduru/tripo-sr:${tripoVersion}`, {
            input: {
                image_path: cleanImageDataUri, 
                do_remove_background: false,
                foreground_ratio: 0.85
            }
        }), 3, 20000);

        console.log(`   ⬇️ Downloading and Uploading GLB...`);
        
        if (!DRY_RUN) {
            const storagePath = `models/${productId}.glb`;
            const signedUrl = await uploadToStorage(modelOutput, storagePath);
            await db.collection('products').doc(productId).update({ model3dUrl: signedUrl, has3D: true });
            console.log(`   ✅ Done! Signed URL: ${signedUrl.substring(0, 50)}...`);
        } else {
            console.log(`   👀 Dry Run`);
        }

    } catch (error) {
        console.error(`   ❌ Error processing ${productId}:`, error.message);
    }
}

async function main() {
    console.log(`🚀 Starting 3D Model Generation Pipeline (Bucket: ${BUCKET_NAME})...`);
    // Убираем фильтр, чтобы пройтись по уже созданным и обновить ссылки
    const snapshot = await db.collection('products').limit(LIMIT).get();
    
    if (snapshot.empty) return console.log("No products found.");
    
    for (const doc of snapshot.docs) {
        await processProduct(doc);
        console.log("   💤 Cooling down for 5s...");
        await sleep(5000); 
    }
}

main().catch(console.error);
