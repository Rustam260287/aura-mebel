// services/geminiService.ts
import type { Product, FurnitureBlueprint, ChatMessage, ChatAnalysisResult, BlogPost } from '../types';

// Helper function to handle API requests to our backend
async function callApi(action: string, body: object) {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сервера.');
    }
    return response.json();
}

// 1. AI Stylist (Text)
export const getStyleRecommendations = (prompt: string, products: Product[]): Promise<{ recommendedProductNames: string[] }> => {
    const productNames = products.map(p => p.name);
    return callApi('styleRecommendations', { prompt, productNames });
};

// 2. Visual Search
export const getVisualRecommendations = (base64: string, mimeType: string, allProducts: Product[]): Promise<{ recommendedProductNames: string[] }> => {
    return callApi('visualSearch', { base64, mimeType, allProducts });
};

// 3. AI Room Makeover
export const generateRoomMakeover = (base64: string, mimeType: string, style: string, allProducts: Product[]): Promise<{ generatedImage: string; recommendedProductNames: string[] }> => {
    return callApi('roomMakeover', { base64, mimeType, style, allProducts });
};

// 4. AI Product Configurator
export const generateConfiguredImage = (base64: string, mimeType: string, productName: string, visualPrompt: string): Promise<{ generatedImage: string }> => {
    return callApi('generateConfiguredImage', { base64, mimeType, productName, visualPrompt });
};
export const getAiConfigurationDescription = (productName: string, selectedOptions: Record<string, string>): Promise<{ description: string }> => {
    return callApi('configDescription', { productName, selectedOptions });
};

// 5. Virtual Staging
export const generateStagedImage = (roomBase64: string, roomMimeType: string, productBase64: string, productMimeType: string, productName: string): Promise<{ stagedImage: string }> => {
    return callApi('stageFurniture', { roomBase64, roomMimeType, productBase64, productMimeType, productName });
};

// 6. Blog Post Generator
export const generateBlogPost = (allProducts: Product[]): Promise<Omit<BlogPost, 'id' | 'imageUrl'> & { imageBase64: string }> => {
    return callApi('generateBlogPost', { allProducts });
};

// 7. Furniture from Photo
export const generateFurnitureFromPhoto = (base64: string, mimeType: string, dimensions: { width: string; height: string; depth: string }): Promise<FurnitureBlueprint> => {
    return callApi('furnitureFromPhoto', { base64, mimeType, dimensions });
};

// 8. Chat Log Analysis
export const analyzeChatLogs = (chatLogs: ChatMessage[][]): Promise<ChatAnalysisResult> => {
    return callApi('analyzeChatLogs', { chatLogs });
};

// 9. AI Assistant Chat
export const sendChatMessage = async (messages: ChatMessage[], allProducts: Product[]): Promise<string> => {
    const data = await callApi('chat', { messages, allProducts });
    return data.reply;
};
