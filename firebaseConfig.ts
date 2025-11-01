// ВАЖНО: Замените этот объект на ваши реальные данные из консоли Firebase!
// Настройки проекта -> Общие -> Ваши приложения -> Веб-приложение (</>)

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Замените на вашу конфигурацию веб-приложения Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Экспортируем инстанс Firestore для использования в других частях приложения
export const db = getFirestore(app);
