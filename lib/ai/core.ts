import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROMPTS, PromptKey } from './prompts';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

interface AIRequestOptions {
  key: PromptKey;
  variables?: Record<string, string | number>;
  model?: string;
  responseFormat?: 'text' | 'json';
  context?: any[];
}

export async function askAI(options: AIRequestOptions) {
  const { key, variables = {}, model = 'gpt-4o', responseFormat = 'text', context = [] } = options;

  let systemPrompt = PROMPTS[key];
  Object.keys(variables).forEach(varName => {
    systemPrompt = systemPrompt.replace(new RegExp(`{{${varName}}}`, 'g'), String(variables[varName]));
  });

  const isGeminiModel = model.startsWith('gemini-');

  try {
    if (isGeminiModel || !process.env.OPENAI_API_KEY) {
      return await askGemini(systemPrompt, context, model, responseFormat);
    }

    return await askOpenAI(systemPrompt, context, model, responseFormat);
  } catch (error: any) {
    console.error(`AI Error [${key}] with ${model}:`, error);

    // Fallback to Gemini if OpenAI fails with regional/auth issues
    const isOpenAIError = error?.status === 403 || error?.code === 'unsupported_country_region_territory' || error?.type === 'request_forbidden';

    if (!isGeminiModel && isOpenAIError && genAI) {
      console.warn("OpenAI blocked or failed, falling back to Gemini...");
      try {
        return await askGemini(systemPrompt, context, 'gemini-2.0-flash', responseFormat);
      } catch (geminiError) {
        console.error("Gemini fallback failed too:", geminiError);
        throw error; // Throw original error if fallback fails
      }
    }
    throw error;
  }
}

async function askOpenAI(systemPrompt: string, context: any[], model: string, responseFormat: string) {
  if (!openai) throw new Error('OpenAI API key not configured');
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...context
  ];

  const completion = await openai.chat.completions.create({
    messages,
    model,
    response_format: responseFormat === 'json' ? { type: 'json_object' } : undefined,
    temperature: 0.7,
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error('AI returned empty content');

  return responseFormat === 'json' ? JSON.parse(content) : content;
}

async function askGemini(systemPrompt: string, context: any[], model: string, responseFormat: string) {
  if (!genAI) throw new Error('Gemini API key not configured');

  const geminiModel = genAI.getGenerativeModel({
    model: model.startsWith('gemini-') ? model : 'gemini-2.0-flash',
    systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
    generationConfig: responseFormat === 'json' ? { responseMimeType: 'application/json' } : undefined
  });

  // Convert OpenAI style context to Gemini
  let history = context.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
  }));

  // Gemini history MUST start with a user message.
  while (history.length > 0 && history[0].role !== 'user') {
    history.shift();
  }

  const lastMsg = history.pop();
  const prompt = lastMsg?.role === 'user' ? lastMsg.parts[0].text : (history.length === 0 ? 'Привет' : 'Продолжай');

  const chat = geminiModel.startChat({
    history: history,
  });

  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  const content = response.text();

  return responseFormat === 'json' ? JSON.parse(content) : content;
}
