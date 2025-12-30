import { DEFAULT_TEXT_MODEL, getOpenAIClient } from './openaiClient';
import { withRetry } from './retry';

export type ObjectDescriptionInput = {
  name: string;
  objectType?: string;
  rawDescription?: string;
};

export async function generateImprovedObjectDescription(
  input: ObjectDescriptionInput,
): Promise<string> {
  const openai = getOpenAIClient();

  const prompt = `Ты — опытный редактор описаний для сервиса визуальной примерки мебели (3D/AR).

Тебе нужно переписать описание объекта так, чтобы оно:
- было на русском;
- звучало спокойно, без давления и без продажных формулировок;
- содержало 2–4 абзаца;
- обязательно упоминало ключевые характеристики (размеры, материалы, стиль), если они видны из текста;
- в конце дало краткий блок "Техническая информация:" с перечислением основных параметров в виде списка.

Название: "${input.name}"
Тип: "${input.objectType || ''}"
Сырое описание: "${input.rawDescription || ''}"

Запрещено: любые финансовые и транзакционные формулировки, призывы и давление.
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
