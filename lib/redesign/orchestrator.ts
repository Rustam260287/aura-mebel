import type { RedesignInput, RedesignResult, RedesignVariant } from './types';
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
 * Generates 3 variants in parallel (Максимум / Баланс / Минимум).
 */
export async function runRedesign(input: RedesignInput): Promise<RedesignResult> {
    const startTime = Date.now();

    // Step 1: Select furniture from collection (with optional roomAnalysis)
    const furniture = await selectFurnitureFromCollection(input, input.roomAnalysis);

    // Step 2: Generate 3 variants in parallel
    console.log('[Redesign] Generating 3 variants in parallel...');

    const presetEntries = Object.entries(PRESETS) as [keyof typeof PRESETS, (typeof PRESETS)[keyof typeof PRESETS]][];

    const variantResults = await Promise.allSettled(
        presetEntries.map(([key, params]) =>
            generateWithAI(input, furniture, params.prompt_strength, params.guidance)
                .then((url) => ({ preset: key, url, label: params.label }))
        )
    );

    const variants: RedesignVariant[] = variantResults
        .flatMap((r) => {
            if (r.status === 'fulfilled' && r.value.url !== input.roomImageUrl) {
                return [{ imageUrl: r.value.url, label: r.value.label, preset: r.value.preset } as RedesignVariant];
            }
            return [];
        });

    const balancedVariant = variants.find((v) => v.preset === 'balanced') ?? variants[0];
    const afterUrl = balancedVariant?.imageUrl ?? input.roomImageUrl;
    const generationStatus: RedesignResult['generationStatus'] = variants.length > 0 ? 'generated' : 'fallback';

    let generationNote: string | undefined;
    if (generationStatus === 'fallback') {
        if (furniture.id !== 'demo') {
            generationNote =
                'AI-визуализация временно недоступна. Мы уже подобрали подходящий объект, и его можно открыть в интерьере.';
        } else {
            generationNote =
                'AI-визуализация временно недоступна. Попробуйте другой стиль или откройте коллекцию вручную.';
        }
    }

    const result: RedesignResult = {
        before: input.roomImageUrl,
        after: afterUrl,
        variants,
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

    console.log(`[Redesign] ✓ Generated ${variants.length}/3 variants in ${result.processingTime}ms`);
    return result;
}

async function selectFurnitureFromCollection(
    input: RedesignInput,
    roomAnalysis?: import('../antigravity/types').RoomAnalysis
) {
    try {
        const matchedObject = await selectCatalogObject({
            objectType: input.object_type,
            mood: input.mood,
            style: input.style,
            roomAnalysis,
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

        const output = await runReplicatePrediction(replicate, {
            image: imageUrl,
            prompt: editPrompt,
            negative_prompt: negativePrompt,
            num_inference_steps: 50,
            guidance_scale: guidanceScale,
            prompt_strength: promptStrength,
        });

        console.log(
            '[Redesign] ✓ Got response:',
            typeof output,
            Array.isArray(output),
            output?.constructor?.name || 'unknown'
        );

        const resultUrl = await extractReplicateResultUrl(output);

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

async function runReplicatePrediction(
    replicate: Replicate,
    input: Record<string, unknown>,
    maxAttempts: number = 2
): Promise<unknown> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            // Model: adirik/interior-design (SDXL-based interior design)
            return await replicate.run(
                'adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38',
                { input }
            );
        } catch (error: any) {
            lastError = error;
            if (!shouldRetryReplicate(error) || attempt >= maxAttempts) {
                throw error;
            }

            const delayMs = getReplicateRetryDelayMs(error, attempt);
            console.warn(`[Redesign] Replicate throttled. Retrying in ${delayMs}ms...`);
            await sleep(delayMs);
        }
    }

    throw lastError instanceof Error ? lastError : new Error('Replicate prediction failed');
}

function shouldRetryReplicate(error: unknown): boolean {
    const status = typeof error === 'object' && error !== null && 'status' in error
        ? (error as { status?: unknown }).status
        : undefined;
    const message = typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message || '')
        : '';

    return status === 429 || message.includes('429 Too Many Requests');
}

function getReplicateRetryDelayMs(error: unknown, attempt: number): number {
    const message = typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message || '')
        : '';
    const retryAfterMatch = message.match(/"retry_after"\s*:\s*(\d+)/);
    const retryAfterSeconds = retryAfterMatch ? Number.parseInt(retryAfterMatch[1], 10) : 0;
    const backoffMs = Math.min(15_000, 1_500 * attempt);
    return Math.max(backoffMs, retryAfterSeconds * 1_000);
}

async function extractReplicateResultUrl(output: unknown): Promise<string | null> {
    if (!output) return null;

    if (typeof output === 'string') {
        return normalizePotentialUrl(output);
    }

    if (output instanceof URL) {
        return output.toString();
    }

    if (Array.isArray(output)) {
        for (const item of output) {
            const nested = await extractReplicateResultUrl(item);
            if (nested) return nested;
        }
        return null;
    }

    if (typeof output === 'object') {
        const candidate = output as {
            url?: (() => string | Promise<string>) | string;
            href?: string;
            getReader?: () => ReadableStreamDefaultReader<Uint8Array>;
            toString?: () => string;
        };

        if (typeof candidate.getReader === 'function') {
            try {
                const streamed = await uploadGeneratedStream(candidate as ReadableStream<Uint8Array>);
                if (streamed) return streamed;
            } catch (error) {
                console.warn('[Redesign] Stream upload failed, falling back to provider URL:', error);
            }
        }

        if (typeof candidate.url === 'function') {
            const result = await candidate.url();
            const normalized = normalizePotentialUrl(result);
            if (normalized) return normalized;
        }

        if (typeof candidate.url === 'string') {
            const normalized = normalizePotentialUrl(candidate.url);
            if (normalized) return normalized;
        }

        if (typeof candidate.href === 'string') {
            const normalized = normalizePotentialUrl(candidate.href);
            if (normalized) return normalized;
        }

        if (typeof candidate.toString === 'function') {
            const normalized = normalizePotentialUrl(candidate.toString());
            if (normalized) return normalized;
        }
    }

    return null;
}

function normalizePotentialUrl(value: unknown): string | null {
    if (value instanceof URL) {
        return value.toString();
    }

    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) return null;
    return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

async function uploadGeneratedStream(stream: ReadableStream<Uint8Array>): Promise<string | null> {
    console.log('[Redesign] Reading image stream...');
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    if (totalLength === 0) return null;

    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
    }

    const inferredUrl = normalizePotentialUrl(new TextDecoder().decode(combined));
    if (inferredUrl) {
        return inferredUrl;
    }

    return uploadGeneratedBinary(Buffer.from(combined));
}

async function uploadGeneratedBinary(buffer: Buffer): Promise<string | null> {
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
    const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;

    if (!isPng && !isJpeg && !isWebp) {
        return null;
    }

    console.log('[Redesign] Uploading generated image to Firebase...');
    const { getAdminStorage } = await import('../firebaseAdmin');
    const storage = getAdminStorage();
    const bucket = storage.bucket();

    const ext = isPng ? 'png' : isWebp ? 'webp' : 'jpg';
    const contentType = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg';
    const filename = `redesign-results/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const file = bucket.file(filename);

    await file.save(buffer, {
        contentType,
        public: true,
    });

    const resultUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    console.log('[Redesign] ✓ Result saved:', resultUrl);
    return resultUrl;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
