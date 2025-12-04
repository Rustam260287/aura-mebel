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
