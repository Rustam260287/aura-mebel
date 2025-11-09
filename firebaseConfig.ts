// ====================================================================================
// Firebase отключен по запросу.
//
// Все данные теперь управляются локально в состоянии приложения
// и не будут сохраняться между сессиями. Для повторного включения Firebase
// необходимо раскомментировать код ниже, а также восстановить логику
// в App.tsx и импорты в index.html.
// ====================================================================================

/*
// Fix: Use scoped firebase packages for imports to resolve module errors.
import { initializeApp, getApp, getApps } from "@firebase/app";
// Fix: Use scoped firebase packages for imports for consistency.
import { getFirestore } from "@firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBH7-JEalupCSHlq6qUbdtQjlLxp0VwVWg", // IMPORTANT: This API Key may be for the old 'azntaxi' project and might need to be replaced with the one from the 'aura-mebel-7ec96' project settings in the Firebase console.
  authDomain: "aura-mebel-7ec96.firebaseapp.com",
  projectId: "aura-mebel-7ec96",
  storageBucket: "aura-mebel-7ec96.appspot.com",
  messagingSenderId: "621709630211", // These values might also need to be updated from the correct project's settings.
  appId: "1:621709630211:web:608fd77dd08577f4f12736",
  measurementId: "G-TYVFN8VQLP"
};


// Initialize Firebase using the v9+ modular syntax.
// This checks if an app instance already exists to prevent errors during hot-reloading.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();


// Get a reference to the Firestore service
// Now that the project ID is correctly configured in `initializeApp`, we can
// get the default database and storage for this project without specifying a different name.
export const db = getFirestore(app);
export const storage = getStorage(app);
*/