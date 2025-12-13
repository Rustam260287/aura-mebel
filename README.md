# Aura Mebel - AI-Powered Furniture Store

This is a Next.js project for "Aura Mebel," an innovative furniture store that leverages AI to enhance the customer experience.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Next, create a `.env.local` file in the root of your project with the public Firebase config and any client-side keys you need:

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-web-api-key
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

Server-side credentials stay private. For Firebase Admin, set the following environment variables (via `.env.local` for local dev, and secret manager/CI for production):

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account", ...}
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

Alternatively you can place a `serviceAccountKey.json` file in the project root for local development (it is git-ignored by default). **Never commit this file or expose your private key via `NEXT_PUBLIC_*` variables.**

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Optimizing 3D models

Для ускорения загрузки и стабильной работы AR на мобильных используем пакетный скрипт:

1.  Подготовьте доступ к Firebase Admin (`serviceAccountKey.json` или переменная `FIREBASE_SERVICE_ACCOUNT`).
2.  Запустите `npm run optimize:3d -- --product <ID>` или `npm run optimize:3d -- --all`.
3.  Скрипт скачает `model3dUrl`, прогонит его через `npx gltf-pipeline` (draco + удаление ненужных атрибутов), загрузит `models/optimized/<ID>.glb`, обновит запись и (если доступен `USDCONVERT_PATH`, `USD_FROM_GLTF_PATH` или `xcrun usdz_converter`) соберёт `model3dIosUrl`.
4.  Дополнительно доступен флаг `--dry` для симуляции.

```bash
npm run optimize:3d -- --product K76YLoU4Co4T4RkF9xJG --dry
USDCONVERT_PATH=/opt/usdz_converter npm run optimize:3d -- --all
```

### USDZ на Windows

1.  Установи Pixar USD локально. Самый простой путь — собрать инструменты из https://github.com/PixarAnimationStudios/USD. После сборки `usd_from_gltf.exe` окажется в `build/USD`.
2.  Укажи путь в переменной окружения `USD_FROM_GLTF_PATH` **или** добавь `usd_from_gltf.exe` в PATH (скрипт найдёт его автоматически). Пример:

    ```bash
    USD_FROM_GLTF_PATH="C:/USD/build/USD/bin/usd_from_gltf.exe" npm run optimize:3d -- --product <ID>
    ```

3.  Путь можно зафиксировать в `.env.local` (для локальной машины) или в CI-среде: `USD_FROM_GLTF_PATH=/path/to/usd_from_gltf`.

Если не хочешь собирать Pixar USD, можно использовать сторонний конвертер, главное — указать его путь через `USDCONVERT_PATH` и, при необходимости, дополнительные аргументы через `USDCONVERT_ARGS`.

## Deploying to Firebase

This is a full-stack Next.js application that requires a server environment to run the AI features.

To deploy your application, use the Firebase CLI. The following command will automatically build your Next.js app, create a Cloud Function to run it, and deploy it to Firebase Hosting.

1.  **Login to Firebase:**
    ```bash
    firebase login
    ```

2.  **Deploy the application:**
    ```bash
    firebase deploy
    ```

Firebase will handle the entire deployment process for you.
