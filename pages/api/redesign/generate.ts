import type { NextApiRequest, NextApiResponse } from 'next';
import { runRedesign } from '../../../lib/redesign/orchestrator';
import type { RedesignInput, RedesignResult } from '../../../lib/redesign/types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RedesignResult | { error: string }>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const input: RedesignInput = req.body;

        // Validate required fields
        if (!input.roomImageUrl || !input.object_type) {
            return res.status(400).json({ error: 'Missing required fields: roomImageUrl, object_type' });
        }

        // Set defaults
        input.style = input.style || 'minimal';
        input.mood = input.mood || 'calm';

        // Run AI redesign (3 parallel variants)
        const result = await runRedesign(input);

        // Save to Firestore history (fire-and-forget, non-blocking)
        saveRedesignToFirestore(input, result).catch(console.error);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Redesign API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function saveRedesignToFirestore(input: RedesignInput, result: RedesignResult) {
    const { getAdminDb } = await import('../../../lib/firebaseAdmin');
    const db = getAdminDb();
    await db.collection('redesignHistory').add({
        objectId: result.selectedFurniture.id,
        objectName: result.selectedFurniture.name,
        objectType: input.object_type,
        style: input.style,
        mood: input.mood,
        beforeImageUrl: result.before,
        afterImageUrl: result.after,
        variants: result.variants ?? [],
        generationStatus: result.generationStatus,
        processingTime: result.processingTime,
        savedAt: new Date().toISOString(),
        room_type: input.room_type ?? null,
    });
}
