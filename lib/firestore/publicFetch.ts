import { FirebaseError, initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore/lite';

const DEFAULT_PROJECT_ID = 'aura-mebel-7ec96';
const DEFAULT_API_KEY = 'AIzaSyCqTiexOTxz7yp0PdSttvQmTAJzQdZMI-Y';
const DEFAULT_AUTH_DOMAIN = 'aura-mebel-7ec96.firebaseapp.com';

const PUBLIC_FETCH_APP_NAME = 'aura-public-fetch';

const getPublicFetchApp = (): FirebaseApp => {
  const existing = getApps().find((app) => app.name === PUBLIC_FETCH_APP_NAME);
  if (existing) return existing;

  return initializeApp(
    {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || DEFAULT_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || DEFAULT_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID,
    },
    PUBLIC_FETCH_APP_NAME,
  );
};

const getPublicFirestore = () => getFirestore(getPublicFetchApp());

const normalizePublicFetchError = (error: unknown) => {
  if (error instanceof FirebaseError) {
    return `${error.code}: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
};

export async function listPublicCollectionDocuments(collectionId: string) {
  try {
    const snapshot = await getDocs(collection(getPublicFirestore(), collectionId));

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<Record<string, unknown> & { id: string }>;
  } catch (error) {
    throw new Error(`Firestore public fetch failed for "${collectionId}": ${normalizePublicFetchError(error)}`);
  }
}
