<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1fGIsNIxKi36pMjGn--rmmJX1Y0iA18ar

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app in development mode:
   `npm run dev`

This will start the development server, typically on http://localhost:3000.

## Build for Production

To create a production-ready build of your application, run the following command:

`npm run build`

This will generate an optimized version of your app in the `.next` directory.

## Run in Production

After building the application, you can start it in production mode with:

`npm run start`

This will start the production server, which is more performant than the development server.
