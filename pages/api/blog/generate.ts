
import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAdminDb } from '../../../lib/firebaseAdmin';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function extractJson(text: string): any {
    // This regex finds a JSON block either in a ```json markdown block or as a standalone object.
    const jsonMatch = text.match(/```json([\s\S]*?)```|(\{[\s\S]*\})/);
    if (!jsonMatch) {
        console.error("AI response did not contain a JSON block. Response:", text);
        throw new Error("Не удалось найти JSON в ответе AI.");
    }
    // Group 1 is the content of ```json ... ```, Group 2 is the standalone object.
    const jsonString = jsonMatch[1] || jsonMatch[2];
     if (!jsonString) {
        throw new Error("Не удалось извлечь JSON-строку.");
    }
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Ошибка парсинга JSON:", e, "\nИсходный текст:", text);
        throw new Error(`Невалидный JSON от AI. Ошибка: ${e instanceof Error ? e.message : String(e)}`);
    }
}

async function generateBlogPost(topic: string): Promise<any> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Using a single template literal for clarity and to avoid joining errors.
    const prompt = `Напиши подробную, увлекательную и полезную статью для блога мебельного магазина на следующую тему: "${topic}".

Статья должна быть хорошо структурирована, с заголовками и абзацами. Она должна быть написана в дружелюбном, но экспертном тоне.
В конце статьи должен быть призыв к действию, например, посетить наш магазин или посмотреть каталог.

В ответ **ОБЯЗАТЕЛЬНО** верни только один JSON-объект, заключенный в блок кода markdown (\`\`\`json ... \`\`\`), со следующей структурой:
{
  "title": "(заголовок статьи)",
  "excerpt": "(короткая выдержка, 1-2 предложения, для превью)",
  "content": "(полный текст статьи в формате HTML, используй теги <h2> для подзаголовков, <p> для абзацев и <strong> или <b> для выделения)",
  "imagePrompt": "(опиши на английском языке изображение, которое хорошо бы подошло к этой статье, для генерации нейросетью, например: a cozy living room with a modern sofa and a large window)"
}`; // IMPORTANT: No comma after the last property

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return extractJson(text);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({ message: 'Тема статьи обязательна' });
        }

        const blogData = await generateBlogPost(topic);

        const newPost = {
            id: new Date().toISOString(),
            ...blogData,
            relatedProducts: [],
            imageUrl: '',
        };

        const db = getAdminDb();
        await db.collection('blog').doc(newPost.id).set(newPost);
        
        res.status(200).json({ message: 'Статья успешно создана', post: newPost });

    } catch (error) {
        // IMPROVED ERROR HANDLING: Pass the actual error message to the client.
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Ошибка в /api/blog/generate:", errorMessage);
        res.status(500).json({ message: errorMessage }); // Sending the specific error message
    }
}
