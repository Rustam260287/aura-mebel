import type { WizardIntent, IntentProfile } from '../types';

/**
 * IntentAgent: Interprets user choices as emotional intent.
 * Does NOT convert to technical parameters.
 */
export class IntentAgent {
    static interpret(input: WizardIntent): IntentProfile {
        // Combine mood and presence into abstract profile
        const { mood, presence } = input;
        const intent_profile = `${mood}_${presence}_presence`;

        return { intent_profile };
    }
}
