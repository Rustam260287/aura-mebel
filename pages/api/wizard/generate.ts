import type { NextApiRequest, NextApiResponse } from 'next';
import { runWizardIntent } from '../../../lib/antigravity/orchestrator';
import type { WizardIntent, FittingResult } from '../../../lib/antigravity/types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<FittingResult | { error: string }>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const input: WizardIntent = req.body;

        // Validate required fields
        if (!input.object_type || !input.presence || !input.mood) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Run Antigravity orchestration
        const result = await runWizardIntent(input);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Wizard API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
