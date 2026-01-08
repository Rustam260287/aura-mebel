import type { WizardIntent, ScaleFit } from '../types';

/**
 * ScaleAndFitAgent: Adjusts scale subtly based on presence.
 * Scale changes within ±10% only.
 */
export class ScaleAndFitAgent {
    static calculateScale(input: WizardIntent): ScaleFit {
        const { presence } = input;

        let scale_factor = 1.0;

        switch (presence) {
            case 'compact':
                scale_factor = 0.92; // -8%
                break;
            case 'balanced':
                scale_factor = 1.0; // No change
                break;
            case 'dominant':
                scale_factor = 1.08; // +8%
                break;
        }

        return { scale_factor };
    }
}
