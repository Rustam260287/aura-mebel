
import OpenAI from 'openai';
import { PROMPTS, PromptKey } from './prompts';

// Инициализация клиента (синглтон)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIRequestOptions {
  key: PromptKey;
  variables?: Record<string, string | number>;
  model?: string;
  responseFormat?: 'text' | 'json';
  context?: any[]; // Для истории чата
}

/**
 * Универсальная функция для общения с AI.
 * Сама подставляет переменные в промпт и парсит JSON.
 */
export async function askAI(options: AIRequestOptions) {
  const { key, variables = {}, model = 'gpt-4-turbo-preview', responseFormat = 'text', context = [] } = options;

  // 1. Получаем шаблон
  let systemPrompt = PROMPTS[key];

  // 2. Подставляем переменные ({{variable}})
  Object.keys(variables).forEach(varName => {
    systemPrompt = systemPrompt.replace(new RegExp(`{{${varName}}}`, 'g'), String(variables[varName]));
  });

  // 3. Формируем сообщения
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...context
  ];

  try {
    // 4. Запрос к OpenAI
    const completion = await openai.chat.completions.create({
      messages,
      model,
      response_format: responseFormat === 'json' ? { type: 'json_object' } : undefined,
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error('AI returned empty content');
    }

    // 5. Обработка ответа
    if (responseFormat === 'json') {
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse AI JSON response:', content);
        throw new Error('AI returned invalid JSON');
      }
    }

    return content;

  } catch (error) {
    console.error(`AI Error [${key}]:`, error);
    throw error;
  }
}
