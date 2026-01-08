
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCqTiexOTxz7yp0PdSttvQmTAJzQdZMI-Y",
  authDomain: "aura-mebel-7ec96.firebaseapp.com",
  projectId: "aura-mebel-7ec96",
  storageBucket: "aura-mebel-7ec96.firebasestorage.app",
  messagingSenderId: "149768023865",
  appId: "1:149768023865:web:7e9fbd950241375d6a02e8",
  measurementId: "G-5YG8EC89CY"
};

// Initialize Firebase with explicit typing to avoid implicit any
// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
  // В режиме разработки при смене ключей иногда нужно "протолкнуть" новый конфиг
  if (process.env.NODE_ENV === 'development') {
    try {
      app = initializeApp(firebaseConfig, 'aura-dev-' + Date.now());
    } catch (e) {
      app = getApps()[0]!;
    }
  }
}

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth, app };
