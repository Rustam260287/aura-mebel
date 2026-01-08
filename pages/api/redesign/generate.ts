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

        // Get preset from request (default: balanced)
        const preset = req.body.preset || 'balanced';

        // Run AI redesign
        const result = await runRedesign(input, preset);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Redesign API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
