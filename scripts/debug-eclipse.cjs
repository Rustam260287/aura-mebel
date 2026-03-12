
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function loadServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }

    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        return JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    }

    throw new Error('Firebase service account is required (FIREBASE_SERVICE_ACCOUNT or serviceAccountKey.json).');
}

const serviceAccount = loadServiceAccount();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
    console.log('Searching for "Eclipse"...');
    // CHANGED: 'objects' -> 'products'
    const snapshot = await db.collection('products').get();

    let found = [];
    let allObjects = [];

    snapshot.forEach(doc => {
        const d = doc.data();
        const name = (d.name || '').toLowerCase();
        const title = (d.title || '').toLowerCase();

        allObjects.push({ id: doc.id, name: d.name, status: d.status, category: d.category });

        if (name.includes('eclipse') || title.includes('eclipse')) {
            found.push({ id: doc.id, ...d });
        }
    });

    if (found.length === 0) {
        console.log('No object found with name "Eclipse". Listing ALL objects to find it:');
        allObjects.forEach(o => {
            // Truncate logic to keep logs clean
            console.log(`${o.id.padEnd(20)} | ${String(o.name).slice(0, 20).padEnd(20)} | Status: ${String(o.status).padEnd(10)} | Cat: ${o.category}`);
        });
    } else {
        console.log(`Found ${found.length} object(s):`);
        found.forEach(o => {
            console.log('------------------------------------------------');
            console.log('ID:', o.id);
            console.log('Name:', o.name);
            console.log('Status:', o.status);
            console.log('Category:', o.category);
            console.log('ObjectType:', o.objectType);
            console.log('Enabled:', o.isEnabled);
            console.log('Published:', o.published);
            console.log('------------------------------------------------');
        });
    }
}

run().catch(console.error);
