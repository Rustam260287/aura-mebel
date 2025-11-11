// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    try {
        const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
        if (!privateKeyBase64) {
            throw new Error('FIREBASE_PRIVATE_KEY_BASE64 is not defined.');
        }
        const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('ascii');
        
        const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (!BUCKET_NAME) {
            throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set.');
        }

        const app = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
            storageBucket: BUCKET_NAME,
        });

        console.log('[ADMIN SDK] Lazy initialization successful.');
        return app;

    } catch (error) {
        console.error('[ADMIN SDK] CRITICAL: Lazy initialization failed:', error);
        return null;
    }
}

export function getAdminDb() {
    const app = initializeAdminApp();
    return app ? app.firestore() : null;
}

export function getAdminStorage() {
    const app = initializeAdminApp();
    return app ? app.storage() : null;
}
