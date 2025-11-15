<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Aura Mebel - AI-Powered Furniture Store

This is a Next.js application for an online furniture store called "Aura," featuring AI-powered tools for customers.

## Project Structure

- **/components**: Contains all React components used throughout the application.
- **/contexts**: Holds React context providers for managing global state (e.g., cart, wishlist).
- **/hooks**: Custom React hooks for shared logic.
- **/lib**: Firebase Admin SDK initialization.
- **/pages**: Next.js pages, including API routes.
- **/public**: Static assets like images and fonts.
- **/services**: Functions for interacting with the Gemini API.
- **/styles**: Global CSS styles.
- **/types**: TypeScript type definitions.
- **/utils**: Utility functions.

## Environment Variables

Create a `.env.local` file in the root of the project and add the following variables:

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL="your-client-email"
NEXT_PUBLIC_FIREBASE_PRIVATE_KEY="your-private-key"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
```

## Running Locally

**Prerequisites:** Node.js

1.  **Install dependencies:**
    `npm install`
2.  **Run the app in development mode:**
    `npm run dev`

This will start the development server, typically on http://localhost:3000.

## Building for Production

To create a production-ready build of your application, run the following command:

`npm run build`

This will generate an optimized version of your app in the `out` directory.

## Deployment to Firebase Hosting

1.  **Build the application:**
    `npm run build`
2.  **Deploy to Firebase:**
    `firebase deploy --only hosting`
