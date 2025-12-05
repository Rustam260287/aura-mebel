
import fs from 'fs/promises';
import path from 'path';

async function updateConfigFiles() {
    try {
        // Читаем сервисный ключ
        let serviceAccountContent = '';
        try {
            serviceAccountContent = await fs.readFile('serviceAccountKey.json', 'utf-8');
            // Убираем переносы строк, чтобы это была одна строка для YAML
            serviceAccountContent = JSON.stringify(JSON.parse(serviceAccountContent));
        } catch (e) {
            console.warn("Предупреждение: serviceAccountKey.json не найден. Переменная будет пустой.");
        }
        
        // Значения ключей (взяты из ваших предыдущих конфигов)
        const OPENAI_KEY = "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";
        const REPLICATE_TOKEN = "r8_bKnvFylXfsoYCKTc8ivvHm4FCX1clqS2xLHrM";

        // --- Обновление .env.local ---
        const envLocalContent = `
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCqTiexOTxz7yp0PdSttvQmTAJzQdZMI-Y
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=aura-mebel-7ec96.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aura-mebel-7ec96
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=aura-mebel-7ec96.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=149768023865
NEXT_PUBLIC_FIREBASE_APP_ID=1:149768023865:web:7e9fbd950241375d6a02e8
OPENAI_API_KEY=${OPENAI_KEY}
REPLICATE_API_TOKEN=${REPLICATE_TOKEN}
FIREBASE_SERVICE_ACCOUNT=${serviceAccountContent}
        `;
        await fs.writeFile('.env.local', envLocalContent.trim());
        console.log('.env.local updated');

        // --- Обновление apphosting.yaml ---
        // ВАЖНО: Используем 'value' вместо 'secret', чтобы избежать ошибки Secret Manager
        const apphostingYamlContent = `
runConfig:
  cpu: 1
  memoryMiB: 2048
  minInstances: 0
  maxInstances: 1
  concurrency: 80
env:
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: AIzaSyCqTiexOTxz7yp0PdSttvQmTAJzQdZMI-Y
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    value: aura-mebel-7ec96.firebaseapp.com
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: aura-mebel-7ec96
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    value: "149768023865"
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    value: "1:149768023865:web:7e9fbd950241375d6a02e8"
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    value: "aura-mebel-7ec96.firebasestorage.app"
  - variable: ADMIN_EMAILS
    value: amin8914@gmail.com
  - variable: OPENAI_API_KEY
    value: "${OPENAI_KEY}"
  - variable: REPLICATE_API_TOKEN
    value: "${REPLICATE_TOKEN}"
  - variable: FIREBASE_SERVICE_ACCOUNT
    value: '${serviceAccountContent}'
        `;
        await fs.writeFile('apphosting.yaml', apphostingYamlContent.trim());
        console.log('apphosting.yaml updated with explicit values (bypassing Secret Manager)');

    } catch (error) {
        console.error('Error updating configs:', error);
    }
}

updateConfigFiles();
