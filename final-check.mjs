// final-check.mjs
import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs';
import path from 'path';

console.log("--- Запуск финальной проверки Vertex AI ---");

// 1. Загрузка учетных данных
const keyFilePath = path.join(process.cwd(), 'google-credentials.json');
let credentials;
try {
  const keyFileContent = fs.readFileSync(keyFilePath, 'utf8');
  credentials = JSON.parse(keyFileContent);
} catch (error) {
  console.error("!!! ОШИБКА: Не удалось загрузить google-credentials.json.", error);
  process.exit(1);
}

// 2. Инициализация клиента с РАБОТАЮЩЕЙ конфигурацией
const PROJECT_ID = credentials.project_id;
const LOCATION = 'us-east1'; // Используем подтвержденный рабочий регион
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
