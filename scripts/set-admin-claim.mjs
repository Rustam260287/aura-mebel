
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (Object.keys(serviceAccount).length > 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    admin.initializeApp();
}

const email = process.argv[2];

if (!email) {
    console.error("Usage: node scripts/set-admin-claim.mjs <email>");
    process.exit(1);
}

async function setAdmin(email) {
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        console.log(`Successfully set admin claim for user: ${email} (UID: ${user.uid})`);
    } catch (error) {
        console.error('Error setting admin claim:', error);
    }
}

setAdmin(email);
