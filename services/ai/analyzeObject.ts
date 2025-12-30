import { DEFAULT_TEXT_MODEL, getOpenAIClient } from './openaiClient';
import { withRetry } from './retry';

export type ObjectSpecsAnalysis = {
  width?: number | null;
  depth?: number | null;
  height?: number | null;
  material?: string | null;
  color?: string | null;
  sleeping_area?: string | null;
};

export async function analyzeObjectDescription(description: string): Promise<ObjectSpecsAnalysis> {
  const openai = getOpenAIClient();

  const prompt = `Проанализируй описание объекта мебели и извлеки характеристики в JSON.

Поля: 
- width (см)
- depth (см)
- height (см)
- material (основной материал)
- color
- sleeping_area (если есть)

Если значения нет — верни null.

Описание:
"${description}"

Верни ТОЛЬКО валидный JSON без пояснений.`;

  const completion = await withRetry(
    () =>
      openai.chat.completions.create({
        model: DEFAULT_TEXT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    { retries: 2 },
  );

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('No content returned from AI');

  try {
    return JSON.parse(content) as ObjectSpecsAnalysis;
  } catch {
    throw new Error('AI returned invalid JSON');
  }
}
