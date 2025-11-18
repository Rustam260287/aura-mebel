
// services/huggingfaceService.ts
import { HfInference } from '@huggingface/inference';

// Важно: Этот ключ будет работать только локально. 
// Для развертывания на сервере его нужно будет спрятать в переменные окружения.
const HF_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN || 'hf_YOUR_HUGGINGFACE_TOKEN_HERE';

if (HF_TOKEN === 'hf_YOUR_HUGGINGFACE_TOKEN_HERE') {
  console.warn('Hugging Face token not found. Please set the NEXT_PUBLIC_HF_TOKEN environment variable.');
}

const hf = new HfInference(HF_TOKEN);

/**
 * Генерирует текст с помощью модели на Hugging Face.
 * @param {string} prompt - Текстовый запрос к модели.
 * @returns {Promise<string>} - Сгенерированный текст.
 */
export async function generateText(prompt: string): Promise<string> {
  try {
    const result = await hf.textGeneration({
      // Одна из самых популярных и быстрых моделей
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: prompt,
      parameters: {
        max_new_tokens: 250, // Максимальное количество генерируемых токенов
        temperature: 0.7,   // "Креативность" модели (от 0 до 1)
        repetition_penalty: 1.2, // Штраф за повторения
      },
    });
    return result.generated_text;
  } catch (error) {
    console.error('Error generating text with Hugging Face:', error);
    // Возвращаем осмысленный текст ошибки, чтобы было понятно, что произошло
    if (error instanceof Error && error.message.includes('authorization')) {
        return "Ошибка: Неверный или отсутствующий токен авторизации Hugging Face.";
    }
    return 'Извините, произошла ошибка при обращении к AI-сервису.';
  }
}

// Пример использования (для тестирования)
/*
async function test() {
  const prompt = "Расскажи короткую историю о роботе, который открыл пекарню.";
  console.log(`Отправляем запрос: "${prompt}"`);
  const response = await generateText(prompt);
  console.log("Ответ от Hugging Face:", response);
}

// test();
*/
