// services/geminiService.ts
import type { Product, FurnitureBlueprint, ChatMessage, ChatAnalysisResult, BlogPost } from '../types';

/**
 * Запрашивает у AI новый дизайн комнаты и список рекомендуемых товаров.
 */
export const generateRoomMakeover = async (
  base64: string,
  mimeType: string,
  style: string,
  allProducts: Product[]
): Promise<{ generatedImage: string; recommendedProductNames: string[] }> => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'roomMakeover',
      base64,
      mimeType,
      style,
      allProducts,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Ошибка сервера.');
  }
  return await response.json();
};


/**
 * Запрашивает у AI описание для выбранной конфигурации товара.
 */
export const getAiConfigurationDescription = async (
  productName: string,
  selectedOptions: Record<string, string>
): Promise<string> => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'configDescription',
      productName,
      selectedOptions,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Ошибка сервера.');
  }
  const data = await response.json();
  return data.description;
};

/**
 * Запрашивает у AI новое изображение товара на основе выбранной конфигурации.
 */
export const generateConfiguredImage = async (
  base64: string,
  mimeType: string,
  productName: string,
  visualPrompt: string
): Promise<string> => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'configImage',
      base64,
      mimeType,
      productName,
      visualPrompt,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Ошибка сервера.');
  }
  const data = await response.json();
  return data.generatedImage;
};

/**
 * Запрашивает у AI чертеж и смету для мебели по фото.
 */
export const generateFurnitureFromPhoto = async (
    base64: string,
    mimeType: string,
    dimensions: { width: string; height: string; depth: string }
): Promise<FurnitureBlueprint> => {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'furnitureFromPhoto',
            base64,
            mimeType,
            dimensions,
        }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сервера.');
    }
    return await response.json();
};

/**
 * Запрашивает у AI SEO-оптимизированное описание для товара.
 */
export const generateSeoProductDescription = async (product: Product): Promise<string> => {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'seoProductDescription',
            product,
        }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сервера.');
    }
    const data = await response.json();
    return data.description;
};

/**
 * Запрашивает у AI рекомендации по стилю на основе текстового запроса.
 */
export const getStyleRecommendations = async (
  prompt: string,
  allProducts: Product[]
): Promise<string[]> => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'styleRecommendations',
      prompt,
      allProducts,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Ошибка сервера.');
  }
    const data = await response.json();
    return data.recommendedProductNames;
};

/**
 * Запрашивает у AI новое изображение товара с измененной обивкой.
 */
export const changeProductUpholstery = async (
  base64: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'changeUpholstery',
      base64,
      mimeType,
      prompt,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Ошибка сервера.');
  }
  const data = await response.json();
  return data.generatedImage;
};

/**
 * Запрашивает у AI анализ логов чата.
 */
export const analyzeChatLogs = async (chatLogs: ChatMessage[][]): Promise<ChatAnalysisResult> => {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'analyzeChatLogs',
            chatLogs,
        }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сервера.');
    }
    return await response.json();
};

/**
 * Запрашивает у AI генерацию поста в блоге.
 */
export const generateBlogPost = async (
  allProducts: Product[]
): Promise<Omit<BlogPost, 'id' | 'imageUrl'> & { imageBase64: string }> => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'generateBlogPost',
      allProducts,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Ошибка сервера.');
  }
  return await response.json();
};
