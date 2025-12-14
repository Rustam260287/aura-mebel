
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { askAI } from '../../../../lib/ai/core';
import { DesignService } from '../../../../lib/ai/design.service';
import admin from 'firebase-admin';

// Снижаем размер пачки до 1, чтобы гарантированно успевать за 10-60 секунд лямбды
const BATCH_SIZE = 1; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { jobId } = req.body;
  if (!jobId) return res.status(400).json({ error: 'Job ID required' });

  const db = getAdminDb();
  if (!db) return res.status(500).json({ error: 'Database not available' });

  try {
    const jobRef = db.collection('jobs').doc(jobId);
    const jobSnap = await jobRef.get();

    if (!jobSnap.exists) return res.status(404).json({ error: 'Job not found' });
    
    const job = jobSnap.data() as any;

    if (job.status === 'completed' || job.status === 'failed') {
        return res.status(200).json({ status: job.status, message: 'Job already finished' });
    }

    const startIndex = job.processedItems;
    const endIndex = Math.min(startIndex + BATCH_SIZE, job.totalItems);
    
    // Если все обработано
    if (startIndex >= job.totalItems) {
        await jobRef.update({ status: 'completed' });
        return res.status(200).json({ status: 'completed', processed: job.totalItems, total: job.totalItems });
    }

    const batchIds = job.targetIds.slice(startIndex, endIndex);
    const newErrors: string[] = [];
    let processedCount = 0;

    console.log(`[Worker] Processing job ${jobId}, items ${startIndex} to ${endIndex}`);

    // Используем for...of для последовательной обработки (надежнее, чем Promise.all для тяжелых задач)
    for (const productId of batchIds) {
        try {
            console.log(`[Worker] Processing product ${productId}`);
            const productRef = db.collection('products').doc(productId);
            const productSnap = await productRef.get();
            
            if (!productSnap.exists) {
                console.log(`[Worker] Product ${productId} not found`);
                processedCount++;
                continue;
            }

            const product = productSnap.data() as any;

            // 1. Задача: Анализ характеристик
            if (job.type === 'bulk_ai_specs') {
                const description = product.description || product.description_main || '';
                
                if (description && description.length > 10) {
                    console.log(`[Worker] Analyzing description for ${productId}...`);
                    const specs = await askAI({
                        key: 'PRODUCT_ANALYZE',
                        variables: { description },
                        responseFormat: 'json',
                        model: 'gpt-3.5-turbo' 
                    });
                    
                    const newSpecs = { ...(product.specs || {}) };
                    if (specs.width) newSpecs['Ширина'] = `${specs.width} см`;
                    if (specs.depth) newSpecs['Глубина'] = `${specs.depth} см`;
                    if (specs.height) newSpecs['Высота'] = `${specs.height} см`;
                    if (specs.material) newSpecs['Материал'] = specs.material;
                    if (specs.color) newSpecs['Цвет'] = specs.color;
                    if (specs.sleeping_area) newSpecs['Спальное место'] = specs.sleeping_area;
                    
                    await productRef.update({ specs: newSpecs });
                    console.log(`[Worker] Updated specs for ${productId}`);
                } else {
                    console.log(`[Worker] Description too short for ${productId}, skipping`);
                }
            } 
            
            // 2. Задача: Генерация интерьерных фото
            else if (job.type === 'bulk_generate_interior_photos') {
                const sourceImage = product.imageUrls?.[0];
                if (!sourceImage) {
                    throw new Error("No source image found");
                }

                const style = 'Modern minimalist interior, soft beige tones';
                console.log(`[Worker] Generating image for ${productId}...`);
                
                const url = await DesignService.generateInterior({
                    imageUrl: sourceImage,
                    style: style,
                    mode: 'product-in-room'
                });

                if (url) {
                    await productRef.update({
                        imageUrls: admin.firestore.FieldValue.arrayUnion(url)
                    });
                    console.log(`[Worker] Added image to ${productId}`);
                }
            }
            
            processedCount++;

        } catch (e: any) {
            console.error(`Error processing product ${productId}:`, e);
            newErrors.push(`ID ${productId}: ${e.message}`);
            processedCount++;
        }
    }

    // --- ОБНОВЛЕНИЕ СТАТУСА ---
    const nextProcessed = startIndex + processedCount;
    const isFinished = nextProcessed >= job.totalItems;

    // Формируем объект обновления без undefined
    const updateData: any = {
        processedItems: nextProcessed,
        status: isFinished ? 'completed' : 'processing'
    };

    // Добавляем ошибки только если они есть
    if (newErrors.length > 0) {
        updateData.errors = admin.firestore.FieldValue.arrayUnion(...newErrors);
    }

    await jobRef.update(updateData);

    console.log(`[Worker] Batch finished. Next processed: ${nextProcessed}`);

    res.status(200).json({ 
        status: isFinished ? 'completed' : 'processing', 
        processed: nextProcessed, 
        total: job.totalItems 
    });

  } catch (error: any) {
    console.error('Job Worker Critical Error:', error);
    res.status(500).json({ error: error.message });
  }
}
