import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { ContextAgent } from '../lib/antigravity/agents/context';

async function testVision() {
    console.log('🧪 Тестирование ContextAgent с Vision API...');

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY не найден в переменных окружения.');
        process.exit(1);
    }
    console.log('✅ API ключ найден:', apiKey.substring(0, 8) + '...');

    // Mock image (1x1 transparent pixel) just to test connectivity (Gemini might complain about image content, but we'll see response)
    // Actually, let's use a real-ish base64 string or just expect a specific error if image is invalid, 
    // but better to test with a description first to ensure at least that path works, 
    // and then try a base64 if possible. 
    // Since I don't have a real image handy, I will verify the Description path first, 
    // and then try to Mock the Image input if possible or ask user to provide one.

    // Тест 1: Анализ по описанию
    console.log('\n--- Тест 1: Анализ по описанию ---');
    const textResult = await ContextAgent.analyze({
        userDescription: 'Просторная светлая гостиная в скандинавском стиле с большими окнами'
    });
    console.log('Результат:', JSON.stringify(textResult, null, 2));

    if (textResult.room_type === 'living_room' && textResult.lighting === 'natural') {
        console.log('✅ Анализ описания прошёл успешно');
    } else {
        console.error('❌ Анализ описания не удался');
    }

    // Тест 2: Проверка инициализации Vision API
    console.log('\n--- Тест 2: Проверка инициализации Vision API ---');
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ GoogleGenerativeAI успешно инициализирован');
    } catch (e) {
        console.error('❌ Ошибка инициализации GoogleGenerativeAI:', e);
    }
}

testVision().catch(console.error);
