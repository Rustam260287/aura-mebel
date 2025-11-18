// final-check.mjs
import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';

// Загружаем переменные окружения из .env.local
dotenv.config({ path: '.env.local' });

console.log("--- Запуск финальной проверки Vertex AI ---");

// 1. Загрузка учетных данных из переменных окружения
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  console.error("!!! ОШИБКА: Не все переменные окружения (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY) определены в .env.local.");
  process.exit(1);
}

const credentials = {
  client_email: CLIENT_EMAIL,
  private_key: PRIVATE_KEY,
};

// 2. Инициализация клиента
const LOCATION = 'us-east1';
const MODEL_NAME = 'gemini-pro';

const vertex_ai = new VertexAI({ project: PROJECT_ID, location: LOCATION, credentials });

// 3. Тестовая функция
async function runFinalCheck() {
  try {
    console.log(`Отправка запроса к модели '${MODEL_NAME}' в регионе '${LOCATION}'...`);
    const model = vertex_ai.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent("Скажи 'проверка прошла успешно' на русском.");
    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (responseText && responseText.includes('успешно')) {
      console.log(`\n✅✅✅ ПОДТВЕРЖДЕНО! ✅✅✅`);
      console.log(`Ответ от модели: "${responseText.trim()}"`);
      console.log("Соединение с Vertex AI стабильно работает с текущими настройками.");
    } else {
      console.error("\n❌ ОШИБКА: Получен неожиданный ответ:", responseText);
    }
  } catch (error) {
    console.error(`\n❌❌❌ КРИТИЧЕСКАЯ ОШИБКА: Запрос не удался.`, error);
    console.error("Пожалуйста, проверьте консоль Google Cloud на предмет возможных проблем с проектом.");
  }
}

// 4. Запуск
runFinalCheck();
