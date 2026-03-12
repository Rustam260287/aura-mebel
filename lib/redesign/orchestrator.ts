import type { RedesignInput, RedesignResult, RedesignVariant } from './types';
import { db } from '../firebaseAdmin';
import Replicate from 'replicate';
import { COLLECTIONS } from '../db/collections';

// Параметры для разных вариантов
// Параметры для разных вариантов
const PRESETS = {
    // 1. Creative: Low image guidance = allows AI to hallucinate/change more. High prompt guidance.
    creative: { image_guidance: 1.1, guidance: 7.0, label: 'Максимум' },

    // 2. Balanced: Medium preservation.
    balanced: { image_guidance: 1.4, guidance: 5.0, label: 'Баланс' },

    // 3. Subtle: High preservation.
    subtle: { image_guidance: 1.8, guidance: 3.5, label: 'Минимум' },
} as const;

const STYLE_KEYWORDS: Record<RedesignInput['style'], string[]> = {
    minimal: ['minimal', 'миним', 'clean', 'scandi', 'scandinav'],
    cozy: ['cozy', 'уют', 'soft', 'warm', 'homey'],
    modern: ['modern', 'соврем', 'contemporary', 'clean'],
    classic: ['classic', 'класс', 'timeless', 'traditional'],
};

const MOOD_MAP: Record<RedesignInput['mood'], string[]> = {
    calm: ['calm', 'soft', 'strict'],
    warm: ['soft', 'calm'],
    fresh: ['expressive', 'calm'],
    dramatic: ['expressive', 'strict'],
};

/**
 * AI Room Redesign Orchestrator
 * Generates 1 variant (balanced) to avoid rate limits.
 * User can regenerate with different preset if needed.
 */
export async function runRedesign(
    input: RedesignInput,
    preset: 'creative' | 'balanced' | 'subtle' = 'balanced'
): Promise<RedesignResult> {
    const startTime = Date.now();

    // Step 1: Select furniture from collection
    const furniture = await selectFurnitureFromCollection(input);

    // Step 2: Generate single variant (avoid rate limits)
    const params = PRESETS[preset];
    console.log(`[Redesign] Generating 1 variant (${preset})...`);

    let afterUrl = input.roomImageUrl;
    try {
        afterUrl = await generateWithAI(input, furniture, params.image_guidance, params.guidance);
    } catch (err) {
        console.error('[Redesign] Generation failed:', err);
    }

    const result: RedesignResult = {
        before: input.roomImageUrl,
        after: afterUrl,
        currentPreset: preset,
        selectedFurniture: {
            id: furniture.id,
            name: furniture.name,
            imageUrl: furniture.imageUrl,
            modelGlbUrl: furniture.modelGlbUrl,
            modelUsdzUrl: furniture.modelUsdzUrl,
            has3D: furniture.has3D,
            description: furniture.description,
        },
        processingTime: Date.now() - startTime,
    };

    console.log(`[Redesign] ✓ Generated in ${result.processingTime}ms`);
    return result;
}

async function selectFurnitureFromCollection(input: RedesignInput) {
    try {
        const objectsCollection = db.collection(COLLECTIONS.objects);
        const snapshot = await objectsCollection
            .where('objectType', '==', input.object_type)
            .limit(20)
            .get();

        const scoreCandidate = (data: FirebaseFirestore.DocumentData) => {
            let score = 0;
            const rawTokens = [
                data.name,
                data.description,
                ...(Array.isArray(data.tags) ? data.tags : []),
                ...(Array.isArray(data.styleTags) ? data.styleTags : []),
                ...(Array.isArray(data.materialTags) ? data.materialTags : []),
            ]
                .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
                .join(' ')
                .toLowerCase();

            const compatibleMoods = MOOD_MAP[input.mood] || [];
            if (compatibleMoods.includes(String(data.mood || '').toLowerCase())) {
                score += 10;
            }

            const styleKeywords = STYLE_KEYWORDS[input.style] || [];
            if (styleKeywords.some((keyword) => rawTokens.includes(keyword))) {
                score += 8;
            }

            if (data.has3D || data.modelGlbUrl || data.modelUsdzUrl) {
                score += 6;
            }

            if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
                score += 3;
            }

            if (String(data.status || '').toLowerCase() === 'ready') {
                score += 2;
            }

            return score;
        };

        const candidates = snapshot.docs
            .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
                const data = doc.data();
                const has3D = Boolean(data.has3D || data.modelGlbUrl || data.modelUsdzUrl);
                return { id: doc.id, data, score: scoreCandidate(data), has3D };
            });

        const with3D = candidates.filter((candidate) => candidate.has3D);
        const rankedCandidates = with3D.length > 0 ? with3D : candidates;

        if (rankedCandidates.length === 0) {
            console.log(`[Redesign] No objects found for ${input.object_type}`);
            return {
                id: 'demo',
                name: 'Подходящий объект из коллекции',
                imageUrl: null,
                modelGlbUrl: null,
                modelUsdzUrl: null,
                has3D: false,
                description: 'Откройте коллекцию, чтобы выбрать объект для дальнейшей примерки.',
            };
        }

        rankedCandidates.sort((a, b) => b.score - a.score);
        const best = rankedCandidates[0];

        console.log('[Redesign] Selected:', best.data.name, '(has 3D:', best.has3D, ')');

        return {
            id: best.id,
            name: best.data.name || 'Мебель',
            imageUrl: best.data.imageUrls?.[0] || null,
            modelGlbUrl: best.data.modelGlbUrl || null,
            modelUsdzUrl: best.data.modelUsdzUrl || null,
            has3D: best.has3D,
            description: best.data.description || null,
        };
    } catch (error) {
        console.error('Error selecting furniture:', error);
        return {
            id: 'demo',
            name: 'Подходящий объект из коллекции',
            imageUrl: null,
            modelGlbUrl: null,
            modelUsdzUrl: null,
            has3D: false,
            description: 'Откройте коллекцию, чтобы выбрать объект для дальнейшей примерки.',
        };
    }
}

async function generateWithAI(
    input: RedesignInput,
    furniture: any,
    imageGuidance: number = 2.0,
    guidanceScale: number = 4.5
): Promise<string> {
    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) {
        console.error('[Redesign] REPLICATE_API_TOKEN not found in environment!');
        console.error('[Redesign] Make sure .env.local has: REPLICATE_API_TOKEN=r8_xxx');
        return input.roomImageUrl;
    }

    try {
        // If it's a data URL, we need to upload to Firebase first
        let imageUrl = input.roomImageUrl;

        if (input.roomImageUrl.startsWith('data:')) {
            console.log('[Redesign] Uploading image to Firebase Storage...');
            imageUrl = await uploadToFirebase(input.roomImageUrl);
            console.log('[Redesign] ✓ Uploaded:', imageUrl.substring(0, 80));
        }

        const replicate = new Replicate({ auth: token });

        const furnitureName = furniture.name || input.object_type;

        // More subtle prompt that preserves the room
        const editPrompt = `Add a beautiful ${furnitureName} to this room, keep the original room layout and lighting`;

        console.log('[Redesign] Prompt:', editPrompt);

        const output = await replicate.run(
            "timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",
            {
                input: {
                    image: imageUrl,
                    prompt: editPrompt,
                    num_inference_steps: 50,
                    image_guidance_scale: imageGuidance,
                    guidance_scale: guidanceScale,
                }
            }
        ) as any;

        console.log('[Redesign] ✓ Got response:', typeof output, Array.isArray(output));

        // Handle different response types
        let resultUrl: string | null = null;

        if (typeof output === 'string') {
            // Direct URL
            resultUrl = output;
        } else if (Array.isArray(output) && output.length > 0) {
            const firstItem = output[0];
            if (typeof firstItem === 'string') {
                resultUrl = firstItem;
            } else if (firstItem && typeof firstItem.getReader === 'function') {
                // It's a ReadableStream with binary image data
                console.log('[Redesign] Reading image stream...');
                const reader = firstItem.getReader();
                const chunks: Uint8Array[] = [];
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                }

                // Combine chunks into single buffer
                const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
                const combined = new Uint8Array(totalLength);
                let offset = 0;
                for (const chunk of chunks) {
                    combined.set(chunk, offset);
                    offset += chunk.length;
                }

                // Check if it's binary image data (PNG starts with specific bytes)
                const isPng = combined[0] === 0x89 && combined[1] === 0x50;
                const isJpeg = combined[0] === 0xFF && combined[1] === 0xD8;

                if (isPng || isJpeg) {
                    console.log('[Redesign] Uploading generated image to Firebase...');
                    // Upload binary to Firebase
                    const { getAdminStorage } = await import('../firebaseAdmin');
                    const storage = getAdminStorage();
                    const bucket = storage.bucket();

                    const ext = isPng ? 'png' : 'jpg';
                    const filename = `redesign-results/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                    const file = bucket.file(filename);

                    await file.save(Buffer.from(combined), {
                        contentType: isPng ? 'image/png' : 'image/jpeg',
                        public: true
                    });

                    resultUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
                    console.log('[Redesign] ✓ Result saved:', resultUrl);
                } else {
                    // Might be a URL as text
                    resultUrl = new TextDecoder().decode(combined);
                }
            }
        }

        if (!resultUrl) {
            console.error('[Redesign] ❌ Could not extract result');
            return input.roomImageUrl;
        }

        console.log('[Redesign] ✓ Success! URL:', resultUrl.substring(0, 80));
        return resultUrl;

    } catch (error: any) {
        console.error('[Redesign] ❌ Error:', error?.message || error);
        return input.roomImageUrl;
    }
}

async function uploadToFirebase(dataUrl: string): Promise<string> {
    const { getAdminStorage } = await import('../firebaseAdmin');
    const storage = getAdminStorage();
    const bucket = storage.bucket();

    // Parse data URL
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid data URL');

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const ext = mimeType.split('/')[1] || 'jpg';
    const filename = `redesign-uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const file = bucket.file(filename);
    await file.save(buffer, { contentType: mimeType, public: true });

    // Return public URL
    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}
