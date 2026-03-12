import type { WizardIntent, IntentProfile, FurnitureSelection } from '../types';
import { selectCatalogObject } from '../../catalog/objectMatching';

/**
 * FurnitureSelector: Selects ONE pre-existing model from Firestore based on intent.
 * CRITICAL: Never invents models. Queries real collection.
 */
export class FurnitureSelector {
    static async select(input: WizardIntent, profile: IntentProfile): Promise<FurnitureSelection> {
        try {
            const { object_type, mood, presence } = input;
            const matchedObject = await selectCatalogObject({
                objectType: object_type,
                mood,
                presence,
            });

            if (!matchedObject) {
                throw new Error('No objects available for wizard selection');
            }

            return { object_id: matchedObject.id };
        } catch (error) {
            console.error('FurnitureSelector error:', error);
            throw new Error('No objects available for wizard selection');
        }
    }
}
