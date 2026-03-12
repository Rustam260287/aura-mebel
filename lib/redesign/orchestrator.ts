import type { RedesignInput, RedesignResult } from './types';
import Replicate from 'replicate';
import { selectCatalogObject } from '../catalog/objectMatching';

// Параметры для разных вариантов
const PRESETS = {
    // 1. Creative: сильное изменение интерьера
    creative: { prompt_strength: 0.85, guidance: 8.0, label: 'Максимум' },

    // 2. Balanced: умеренное изменение
    balanced: { prompt_strength: 0.65, guidance: 6.0, label: 'Баланс' },

    // 3. Subtle: минимальное изменение, сохраняет оригинал
    subtle: { prompt_strength: 0.45, guidance: 4.0, label: 'Минимум' },
} as const;

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
    let generationStatus: RedesignResult['generationStatus'] = 'fallback';
    let generationNote: string | undefined = 'Показываем исходное фото, потому что визуализация пока недоступна.';

    try {
        afterUrl = await generateWithAI(input, furniture, params.prompt_strength, params.guidance);
        if (afterUrl && afterUrl !== input.roomImageUrl) {
            generationStatus = 'generated';
            generationNote = undefined;
        } else if (furniture.id !== 'demo') {
            generationNote = 'AI-визуализация временно недоступна. Мы уже подобрали подходящий объект, и его можно открыть в интерьере.';
        } else {
            generationNote = 'AI-визуализация временно недоступна. Попробуйте другой стиль или откройте коллекцию вручную.';
        }
    } catch (err) {
        console.error('[Redesign] Generation failed:', err);
    }

    const result: RedesignResult = {
        before: input.roomImageUrl,
        after: afterUrl,
        currentPreset: preset,
        generationStatus,
        generationNote,
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
        const matchedObject = await selectCatalogObject({
            objectType: input.object_type,
            mood: input.mood,
            style: input.style,
        });

        if (!matchedObject) {
            console.log(`[Redesign] No objects found for ${input.object_type}`);
            return {
                id: 'demo',
                name: 'Подходящий объект из коллекции',
                imageUrl: undefined,
                modelGlbUrl: undefined,
                modelUsdzUrl: undefined,
                has3D: false,
                description: 'Откройте коллекцию, чтобы выбрать объект для дальнейшей примерки.',
            };
        }

        console.log('[Redesign] Selected:', matchedObject.name, '(has 3D:', matchedObject.has3D, ')');

        return {
            id: matchedObject.id,
            name: matchedObject.name || 'Мебель',
            imageUrl: matchedObject.imageUrl,
            modelGlbUrl: matchedObject.modelGlbUrl,
            modelUsdzUrl: matchedObject.modelUsdzUrl,
            has3D: matchedObject.has3D,
            description: matchedObject.description,
        };
    } catch (error) {
        console.error('Error selecting furniture:', error);
        return {
            id: 'demo',
            name: 'Подходящий объект из коллекции',
            imageUrl: undefined,
            modelGlbUrl: undefined,
            modelUsdzUrl: undefined,
            has3D: false,
            description: 'Откройте коллекцию, чтобы выбрать объект для дальнейшей примерки.',
        };
    }
}

async function generateWithAI(
    input: RedesignInput,
    furniture: any,
    promptStrength: number = 0.65,
    guidanceScale: number = 6.0
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

        const styleMap: Record<string, string> = {
            minimal: 'minimalist style, clean lines, neutral tones',
            cozy: 'cozy warm style, soft textures, warm lighting',
            modern: 'modern contemporary style, sleek design',
            classic: 'classic elegant style, timeless design',
        };
        const styleDesc = styleMap[input.style] || input.style;

        const editPrompt = `Interior design photo, ${styleDesc}, featuring a ${furnitureName}, beautiful room, high quality, photorealistic`;
        const negativePrompt = 'ugly, blurry, distorted, low quality, watermark, text, deformed furniture';

        console.log('[Redesign] Prompt:', editPrompt);

        const output = await replicate.run(
            "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
            {
                input: {
                    image: imageUrl,
                    prompt: editPrompt,
                    negative_prompt: negativePrompt,
                    num_inference_steps: 50,
                    guidance_scale: guidanceScale,
                    prompt_strength: promptStrength,
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
