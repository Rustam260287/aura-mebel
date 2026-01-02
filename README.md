# Labelcom — AR/3D decision-making service

This is a Next.js project for Labelcom — a calm 3D/AR furniture try-on and visual decision-making service (not an e-commerce shop).

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
# Optional (if you don't have email auth):
ADMIN_UIDS=uid1,uid2
```

Alternatively you can place a `serviceAccountKey.json` file in the project root for local development (it is git-ignored by default). **Never commit this file or expose your private key via `NEXT_PUBLIC_*` variables.**

Then, run the development server:

```bash
npm run dev
```

Note: `npm run dev` uses webpack to avoid Turbopack chunk-load instability during local iteration. If you want Turbopack, run `next dev --turbo`.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin roles (experience tracking)

The admin analytics screens are role-gated:

- `owner`: aggregated-only (no per-visitor view)
- `manager`: can see anonymized visitor timelines and hand-off contacts

Configure via environment variables (optional):

```
OWNER_EMAILS=owner@example.com
MANAGER_EMAILS=manager1@example.com,manager2@example.com
```

`OWNER_EMAILS` / `MANAGER_EMAILS` also grant admin access. If roles are not configured, admins default to `owner` for the analytics module.

## Optimizing 3D models

### Admin upload pipeline (recommended)

В админке можно загрузить **только один файл `.glb`** — он считается master-форматом. Дальше система автоматически:

1. Сохраняет исходник: `models/{objectId}/original.glb`
2. Оптимизирует GLB (Draco + перепаковка текстур ≤ 2048)
3. Валидирует результат (glTF Validator)
4. Загружает продакшн-артефакт: `models/{objectId}/optimized.glb`
5. Пытается сгенерировать `models/{objectId}/ios.usdz` (best-effort)
6. Обновляет в базе `modelGlbUrl`, `modelUsdzUrl` и `modelProcessing` (статусы, размеры, доступные платформы)

Статусы обработки: `UPLOADED → OPTIMIZING → OPTIMIZED → GENERATING_USDZ → READY` (или `READY_WITHOUT_IOS`, если USDZ не удалось создать).

Если на окружении нет конвертера в USDZ, iOS останется недоступным до подключения конвертера. Поддерживаются переменные окружения:

- `USDCONVERT_PATH` (+ `USDCONVERT_ARGS`)
- `USD_FROM_GLTF_PATH`
- `XCRUN_USD_CONVERTER`
- `BLENDER_PATH` (+ `LABELCOM_BLENDER_USDZ_SCRIPT`, по умолчанию `scripts/convert_glb_to_usdz.py`)

Тюнинг лимитов:

- `LABELCOM_TARGET_GLB_MAX_BYTES` (default: 10MB)
- `LABELCOM_MAX_TEXTURE_SIZE` (default: 2048)
- `LABELCOM_JPEG_QUALITY` (default: 85)

Если WebGL/`<model-viewer>` не может загрузить `.glb` из Storage (CORS), убедитесь, что на bucket настроен CORS. В проекте есть пример `cors.json` — можно применить его командой:

```bash
gsutil cors set cors.json gs://<your-bucket>
```

Для ускорения загрузки и стабильной работы AR на мобильных используем пакетный скрипт:

1.  Подготовьте доступ к Firebase Admin (`serviceAccountKey.json` или переменная `FIREBASE_SERVICE_ACCOUNT`).
2.  Запустите `npm run optimize:3d -- --object <ID>` или `npm run optimize:3d -- --all` (флаг `--product` остаётся для legacy).
3.  Скрипт скачает `modelGlbUrl` (fallback: `model3dUrl`), прогонит его через `npx gltf-pipeline` (draco + удаление ненужных атрибутов), загрузит `models/optimized/<ID>.glb`, обновит запись и (если доступен `USDCONVERT_PATH`, `USD_FROM_GLTF_PATH` или `xcrun usdz_converter`) соберёт `modelUsdzUrl` (fallback: `model3dIosUrl`).
4.  Дополнительно доступен флаг `--dry` для симуляции.

```bash
npm run optimize:3d -- --object K76YLoU4Co4T4RkF9xJG --dry
USDCONVERT_PATH=/opt/usdz_converter npm run optimize:3d -- --all
```

### USDZ на Windows

1.  Установи Pixar USD локально. Самый простой путь — собрать инструменты из https://github.com/PixarAnimationStudios/USD. После сборки `usd_from_gltf.exe` окажется в `build/USD`.
2.  Укажи путь в переменной окружения `USD_FROM_GLTF_PATH` **или** добавь `usd_from_gltf.exe` в PATH (скрипт найдёт его автоматически). Пример:

    ```bash
    USD_FROM_GLTF_PATH="C:/USD/build/USD/bin/usd_from_gltf.exe" npm run optimize:3d -- --object <ID>
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
