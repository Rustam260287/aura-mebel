
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../../lib/firebaseAdmin';
import { askAI } from '../../../../lib/ai/core';
import admin from 'firebase-admin';
import { verifyAdmin } from '../../../../lib/auth/admin-check';
import { COLLECTIONS } from '../../../../lib/db/collections';

const BATCH_SIZE = 1; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // --- SECURITY CHECK ---
  const isAdmin = await verifyAdmin(req, res);
  if (!isAdmin) return;
  // ----------------------

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
    
    if (startIndex >= job.totalItems) {
        await jobRef.update({ status: 'completed' });
        return res.status(200).json({ status: 'completed', processed: job.totalItems, total: job.totalItems });
    }

    const batchIds = job.targetIds.slice(startIndex, endIndex);
    const newErrors: string[] = [];
    let processedCount = 0;

    console.log(`[Worker] Processing job ${jobId}, items ${startIndex} to ${endIndex}`);

    for (const objectId of batchIds) {
        try {
            const objectRef = db.collection(COLLECTIONS.objects).doc(objectId);
            const objectSnap = await objectRef.get();
            
            if (!objectSnap.exists) {
                processedCount++;
                continue;
            }

            const object = objectSnap.data() as any;

            if (job.type === 'bulk_ai_specs') {
                const description = object.description || object.description_main || '';
                
                if (description && description.length > 10) {
                    const specs = await askAI({
                        key: 'OBJECT_ANALYZE',
                        variables: { data: description }, // FIXED: was { description }
                        responseFormat: 'json',
                        model: 'gpt-3.5-turbo' 
                    });
                    
                    const newSpecs = { ...(object.specs || {}) };
                    if (specs.width) newSpecs['Ширина'] = `${specs.width} см`;
                    if (specs.depth) newSpecs['Глубина'] = `${specs.depth} см`;
                    if (specs.height) newSpecs['Высота'] = `${specs.height} см`;
                    if (specs.material) newSpecs['Материал'] = specs.material;
                    if (specs.color) newSpecs['Цвет'] = specs.color;
                    if (specs.sleeping_area) newSpecs['Спальное место'] = specs.sleeping_area;
                    
                    await objectRef.update({ specs: newSpecs });
                }
            }
            
            processedCount++;

        } catch (e: any) {
            console.error(`Error processing object ${objectId}:`, e);
            newErrors.push(`ID ${objectId}: ${e.message}`);
            processedCount++;
        }
    }

    const nextProcessed = startIndex + processedCount;
    const isFinished = nextProcessed >= job.totalItems;

    const updateData: any = {
        processedItems: nextProcessed,
        status: isFinished ? 'completed' : 'processing'
    };

    if (newErrors.length > 0) {
        updateData.errors = admin.firestore.FieldValue.arrayUnion(...newErrors);
    }

    await jobRef.update(updateData);

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
