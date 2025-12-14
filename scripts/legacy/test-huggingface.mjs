// test-huggingface.mjs
import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

// Загружаем переменные окружения из .env.local
dotenv.config({ path: '.env.local' });

console.log("--- Запуск теста Hugging Face API (с моделью 'flan-t5-xxl' и задачей 'textGeneration') ---");

// 1. Загрузка токена из переменных окружения
const HF_TOKEN = process.env.HUGGING_FACE_API_KEY;

if (!HF_TOKEN || HF_TOKEN === 'ВАШ_HUGGING_FACE_KEY') {
  console.error("!!! ОШИБКА: Токен HUGGING_FACE_API_KEY не найден или не изменен в файле .env.local.");
  process.exit(1);
}

const hf = new HfInference(HF_TOKEN);
// Используем надежную модель для textGeneration
const model = 'google/flan-t5-xxl';

// 2. Тестовая функция
async function runHuggingFaceTest() {
  try {
    const userInput = "Напиши короткое приветствие от AI-ассистента мебельного магазина.";
    console.log(`Отправка запроса к модели '${model}'...`);
    console.log(`Сообщение пользователя: "${userInput}"`);

    const result = await hf.textGeneration({
      model: model,
      inputs: userInput,
      parameters: { max_new_tokens: 50 }
    });

    const generatedText = result.generated_text;

    if (generatedText) {
      console.log(`\n✅✅✅ УСПЕХ! ✅✅✅`);
      console.log(`Ответ от модели: "${generatedText.trim()}"`);
      console.log("Соединение с Hugging Face API работает.");
    } else {
      console.error("\n❌ ОШИБКА: Получен неожиданный ответ:", result);
    }
  } catch (error) {
    console.error(`\n❌❌❌ КРИТИЧЕСКАЯ ОШИБКА: Запрос не удался.`, error);
    console.error("Пожалуйста, проверьте ваш токен HUGGING_FACE_API_KEY и статус модели на Hugging Face Hub.");
  }
}

// 3. Запуск
runHuggingFaceTest();
