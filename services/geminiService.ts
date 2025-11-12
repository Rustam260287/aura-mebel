// services/geminiService.ts
import type { Product } from '../types';

// ... (generateRoomMakeover и generateStagedImage без изменений)

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
