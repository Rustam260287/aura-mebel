import { DEFAULT_TEXT_MODEL, getOpenAIClient } from './openaiClient';
import { withRetry } from './retry';

export type SeoInput = {
  name: string;
  category?: string;
  description?: string;
};

export async function generateSeoDescription(input: SeoInput): Promise<string> {
  const openai = getOpenAIClient();

  const prompt = `Напиши привлекательное и оптимизированное для поисковых систем (SEO) описание (meta description) для товара.
Название: "${input.name}".
Категория: "${input.category || ''}".
Описание: "${input.description || ''}".

Сделай описание длиной от 140 до 160 символов. Используй ключевые слова, призывай к действию, но звучи естественно. Описание должно быть на русском языке. Верни только готовый текст без кавычек.`;

  const completion = await withRetry(
    () =>
      openai.chat.completions.create({
        model: DEFAULT_TEXT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 120,
      }),
    { retries: 2 },
  );

  const generatedText = completion.choices[0]?.message?.content;
  if (!generatedText) {
    throw new Error('No SEO text generated');
  }

  return generatedText.trim().replace(/^["']|["']$/g, '');
}

