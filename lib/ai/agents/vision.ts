import { GoogleGenerativeAI } from '@google/generative-ai';
import { RoomAnalysis, FurnitureZone } from '../types';

export class VisionAgent {
    static async analyze(imageBase64: string): Promise<RoomAnalysis> {
        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('[VisionAgent] No API Key provided');
            return this.getDefaultAnalysis();
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            // Clean base64
            const base64Clean = imageBase64.split(',')[1] || imageBase64;

            const prompt = `
        You are a top-tier Interior Designer, not a surveyor. 
        Your goal is to Inspire the user, not measure the room.
        
        Analyze this image and return a JSON (NO markdown).
        
        Focus on:
        1. ATMOSPHERE & VIBE: How does the room FEEL? (Cozy, Airy, Moody, Sterile?)
        2. STYLE: Use precise design terms (Japandi, Wabi-Sabi, Mid-Century, Industrial).
        3. COLOR PALETTE: Extract the 3 main mood-setting colors.
        4. RECOMMENDATIONS: Suggest 2-3 specific furniture types that would ELEVATE this space visually.
           - DO NOT suggest "renovations".
           - DO NOT talk about dimensions (mm/cm).
           - Focus on materials, textures, and forms (e.g., "velvet sofa", "oak table").
        
        Required JSON Structure:
        {
          "room_type": "string",
          "style": "string (e.g. Soft Minimal)",
          "mood": "string (e.g. Calm Morning)",
          "lighting": "natural" | "artificial" | "mixed",
          "colors": ["#hex1", "#hex2", "#hex3"],
          "recommendations": ["string 1", "string 2"],
          "layout_suggestions": [ { "item": "string", "x": 50, "y": 50 } ],
          "reasoning": "string (Short poetic explanation why these items fit)"
        }
        
        For 'layout_suggestions':
        - Propose 2-3 spots for the recommended items.
        - x, y are percentages (0-100) of the image width/height from top-left.
      `;

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64Clean, mimeType: 'image/jpeg' } }
            ]);

            const text = result.response.text();
            const cleanJson = text.replace(/```json /g, '').replace(/```/g, '').trim();

            const analysis = JSON.parse(cleanJson);

            return {
                ...this.getDefaultAnalysis(),
                ...analysis
            };

        } catch (error) {
            console.error('[VisionAgent] Error:', error);
            return this.getDefaultAnalysis();
        }
    }

    private static getDefaultAnalysis(): RoomAnalysis {
        return {
            room_type: 'unknown',
            style: 'modern',
            lighting: 'mixed',
            colors: ['#ffffff'],
            furniture_zones: [],
            confidence: 0
        };
    }
}
