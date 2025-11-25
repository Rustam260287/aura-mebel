
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('❌ No API KEY found');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function listModels() {
    try {
        // Получаем модель-менеджер (в SDK он может быть недоступен напрямую, но попробуем простой запрос)
        // К сожалению, SDK @google/generative-ai пока не имеет прямого метода listModels в публичном классе,
        // но мы можем сделать прямой fetch запрос к REST API.
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log('✅ Доступные модели:');
            data.models.forEach(m => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.error('❌ Не удалось получить список моделей:', data);
        }

    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
}

listModels();
