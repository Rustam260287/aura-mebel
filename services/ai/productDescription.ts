import { DEFAULT_TEXT_MODEL, getOpenAIClient } from './openaiClient';
import { withRetry } from './retry';

export type ProductDescriptionInput = {
  name: string;
  category?: string;
  rawDescription?: string;
};

export async function generateImprovedProductDescription(
  input: ProductDescriptionInput,
): Promise<string> {
  const openai = getOpenAIClient();

  const prompt = `Ты — опытный копирайтер для премиального мебельного магазина.

Тебе нужно переписать описание товара так, чтобы оно:
- было на русском;
- звучало живо и продающе;
- содержало 2–4 абзаца;
- обязательно упоминало ключевые характеристики (размеры, материалы, стиль), если они видны из текста;
- в конце дало краткий блок "Техническая информация:" с перечислением основных параметров в виде списка.

Название: "${input.name}"
Категория: "${input.category || ''}"
Сырое описание: "${input.rawDescription || ''}"

Верни только готовый текст без пояснений и без разметки Markdown.`;

  const completion = await withRetry(
    () =>
      openai.chat.completions.create({
        model: DEFAULT_TEXT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 700,
      }),
    { retries: 2 },
  );

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error('No description generated');

  return text.trim();
}

