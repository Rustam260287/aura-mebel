import { db } from '../../firebaseAdmin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export class CatalogAgent {
    /**
     * Acts as a Visual Curator.
     * 1. Fetches candidates (broad search)
     * 2. Curates best emotional fit via LLM
     */
    /**
     * Acts as a Visual Curator.
     * 1. Extracts constraints (Category, Style) from User Query + Context
     * 2. Fetches candidates (broad search)
     * 3. Curates best emotional fit via LLM (Refinement Loop)
     */
    static async search(query: { category?: string, style?: string, userQuery?: string, limit?: number, previousItems?: any[], contextStr?: string }) {
        try {
            console.log(`[CatalogAgent] Input: ${query.userQuery}`);

            // 0. Smart Parameter Extraction
            // If user says "Show me sofas", we must override any previous category.
            // If user says "Darker", we keep previous category.
            const params = await this.extractParameters(query.userQuery || '', query.contextStr || '');
            const targetCategory = params.category || query.category;
            const targetStyle = params.style || query.style || 'modern';

            console.log(`[CatalogAgent] Target: ${targetCategory} / ${targetStyle} (Mood: ${params.mood})`);

            // 1. Fetch Candidates (Broad Match)
            let ref = db.collection('products');
            let snapshot;

            // If category is known, limit by it.
            if (targetCategory && targetCategory !== 'unknown') {
                snapshot = await ref.where('objectType', '==', targetCategory).limit(50).get();
            } else {
                snapshot = await ref.limit(50).get();
            }

            if (snapshot.empty) return [];

            const candidates = snapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    type: d.objectType,
                    style: d.style || 'modern',
                    name: d.name,
                    // Combine descriptive fields for the LLM
                    description: [d.description, d.style, d.material, d.color].join(' '),
                    visual_tags: d.tags || []
                };
            });

            // Exclude previously shown items to ensure freshness
            const previousIds = new Set((query.previousItems || []).map(i => i.id));
            const freshCandidates = candidates.filter(c => !previousIds.has(c.id));

            if (freshCandidates.length === 0) {
                return []; // No new items found
            }

            // 2. Curate via Gemini LLM
            const prompt = `
                You are Catalog Agent in the AURA product.
                Role: Visual Curator.
                Goal: Select 3 objects that BEST MATCH the user's refinement of their request.
                
                Current User Request: "${query.userQuery || 'Something stylish'}"
                Inferred Context: Looking for ${targetCategory || 'furniture'} in ${targetStyle} style. Mood: ${params.mood || 'any'}.
                
                Previous Items Shown (Context):
                ${JSON.stringify((query.previousItems || []).slice(-3).map(i => ({ name: i.name, desc: i.description })))}
                
                Candidates JSON:
                ${JSON.stringify(freshCandidates.map(c => ({ id: c.id, type: c.type, desc: c.description })))}
                
                Return a JSON object (NO markdown):
                {
                  "items": [
                    { "id": "string", "reason": "Russian semantic match reason" }
                  ]
                }
                
                Rules:
                - Pick strictly 3 items (or fewer if no fit).
                - Use "Previous Items" to understand relative terms like "Darker", "Cheaper", "More modern".
                - If request is "Something else", pick items DIFFERENT from Previous Items.
                - NO sales talk. Focus on aesthetics.
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const curation = JSON.parse(cleanJson);

            // 3. Hydrate results
            const curatedIds = new Set(curation.items.map((i: any) => i.id));
            const finalProducts = freshCandidates
                .filter(c => curatedIds.has(c.id))
                .map(c => {
                    const curatedItem = curation.items.find((i: any) => i.id === c.id);
                    return {
                        ...snapshot.docs.find(d => d.id === c.id)?.data(),
                        id: c.id,
                        aiReasoning: curatedItem?.reason
                    };
                });

            return finalProducts;

        } catch (error) {
            console.error('[CatalogAgent] Curation failed:', error);
            return [];
        }
    }

    private static async extractParameters(userQuery: string, contextStr: string): Promise<{ category?: string; style?: string; mood?: string }> {
        if (!userQuery) return {};
        try {
            const prompt = `
                Extract furniture search parameters from this user query.
                Query: "${userQuery}"
                Prior Context: "${contextStr}"
                
                Return JSON:
                {
                    "category": "sofa" | "armchair" | "bed" | "table" | "chair" | "shelf" | "unknown" (if unchanged, use null),
                    "style": "string" (or null),
                    "mood": "string" (or null)
                }
             `;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(clean);
        } catch {
            return {};
        }
    }
}
