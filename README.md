# Aura Mebel - AI-Powered Furniture Store

This is a Next.js project for "Aura Mebel," an innovative furniture store that leverages AI to enhance the customer experience.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Next, create a `.env.local` file in the root of your project and add your Firebase and Gemini API credentials:

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL=your-client-email
NEXT_PUBLIC_FIREBASE_PRIVATE_KEY=your-private-key
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

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
