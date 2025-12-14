
import Replicate from 'replicate';
import { MediaService } from '../media/service';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export interface RedesignOptions {
  imageUrl: string;
  prompt?: string;
  style?: string;
  mode: 'redesign' | 'product-in-room'; // redesign = change room style, product-in-room = keep product, change room
}

export class DesignService {
  
  /**
   * Запускает генерацию через Replicate и сохраняет результат в Firebase Storage.
   * Возвращает постоянную ссылку.
   */
  static async generateInterior(options: RedesignOptions): Promise<string> {
    const { imageUrl, prompt, style, mode } = options;

    if (!imageUrl) throw new Error("Image URL is required");

    // "black-forest-labs/flux-dev" - Top tier realism
    const model = "black-forest-labs/flux-dev";
    
    let finalPrompt = "";
    let promptStrength = 0.85;

    if (mode === 'product-in-room') {
        // Режим "Товар в интерьере": сохраняем структуру товара, меняем окружение
        finalPrompt = `A hyper-realistic professional photography of the furniture item from the image placed in a beautiful ${style || 'modern'} interior. Soft natural lighting, realistic shadows, high quality, 4k, interior design magazine style. ${prompt || ''}`;
        promptStrength = 0.45; // Слабее меняем исходник, чтобы сохранить узнаваемость товара
    } else {
        // Режим "Редизайн комнаты": меняем стиль полностью
        finalPrompt = `A photo of a room interior in ${style || 'modern'} style. ${prompt || ''}. High quality, photorealistic, architectural digest, 8k.`;
        promptStrength = 0.85;
    }

    const input: any = {
        prompt: finalPrompt,
        image: imageUrl, 
        go_fast: true,
        guidance: 3.5,   
        megapixels: "1",
        num_inference_steps: 28,
        output_format: "jpg",
        output_quality: 95,
        prompt_strength: promptStrength
    };

    try {
        console.log(`[DesignService] Starting generation: ${mode}, style: ${style}`);
        
        // Replicate.run returns output directly (url or array of urls)
        const output = await this.runWithRetry(() => replicate.run(model, { input }));
        
        const replicateUrl = Array.isArray(output) ? output[0] : output;

        if (typeof replicateUrl !== 'string' || !replicateUrl.startsWith('http')) {
            throw new Error("Invalid response from AI model");
        }

        console.log("[DesignService] Generated. Uploading to Storage...");
        
        // Save to our storage (persistent URL)
        const storageUrl = await MediaService.uploadFromUrl(replicateUrl, 'ai-generated-interiors');
        
        console.log("[DesignService] Done:", storageUrl);
        return storageUrl;

    } catch (error: any) {
        console.error("[DesignService] Error:", error);
        throw error;
    }
  }

  // Helper for rate limits
  private static async runWithRetry(fn: () => Promise<any>, retries = 2, delay = 2000): Promise<any> {
    try {
        return await fn();
    } catch (error: any) {
        const isRateLimit = error.response?.status === 429 || error.status === 429;
        if (retries > 0 && isRateLimit) {
            console.log(`[DesignService] Rate limit. Retrying in ${delay/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.runWithRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
  }
}
