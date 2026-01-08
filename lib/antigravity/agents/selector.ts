import type { WizardIntent, IntentProfile, FurnitureSelection } from '../types';
import { db } from '../../firebaseAdmin';

/**
 * FurnitureSelector: Selects ONE pre-existing model from Firestore based on intent.
 * CRITICAL: Never invents models. Queries real collection.
 */
export class FurnitureSelector {
    static async select(input: WizardIntent, profile: IntentProfile): Promise<FurnitureSelection> {
        try {
            const { object_type, mood, presence } = input;

            // Start with base query
            let query = db.collection('products')
                .where('objectType', '==', object_type)
                .limit(10); // Get more candidates for filtering

            // Execute query
            const snapshot = await query.get();

            if (snapshot.empty) {
                // Fallback: try without objectType filter
                const fallbackSnapshot = await db.collection('products')
                    .limit(10)
                    .get();

                if (fallbackSnapshot.empty) {
                    return { model_key: 'fallback_default' };
                }

                return { model_key: fallbackSnapshot.docs[0].id };
            }

            // Filter by mood and presence if available
            const candidates = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
                id: doc.id,
                data: doc.data(),
            }));

            // Score each candidate
            const scored = candidates.map((candidate: { id: string; data: FirebaseFirestore.DocumentData }) => {
                let score = 0;
                const data = candidate.data;

                // Exact mood match: +10
                if (data.mood === mood) score += 10;
                // Exact presence match: +10
                if (data.presence === presence) score += 10;
                // Has 3D: +5
                if (data.has3D || data.modelGlbUrl) score += 5;

                return { id: candidate.id, score };
            });

            // Sort by score descending
            scored.sort((a: { id: string; score: number }, b: { id: string; score: number }) => b.score - a.score);

            // Return best match
            return { model_key: scored[0].id };
        } catch (error) {
            console.error('FurnitureSelector error:', error);
            // Fallback to any object
            try {
                const fallbackSnapshot = await db.collection('products').limit(1).get();
                if (!fallbackSnapshot.empty) {
                    return { model_key: fallbackSnapshot.docs[0].id };
                }
            } catch { }

            return { model_key: 'fallback_default' };
        }
    }
}
