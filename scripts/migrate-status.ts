
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { CollectionReference } from 'firebase-admin/firestore';

// --- Configuration ---
const COLLECTION_NAME = (process.env.LABELCOM_OBJECTS_COLLECTION || 'products').trim() || 'products';
const SOFT_CATEGORIES = ['мягкая мебель', 'sofa', 'диваны', 'кресла', 'пуфы'];

// --- Setup Firebase Admin ---
// We duplicate the init logic slightly to be standalone or reuse existing if possible.
// Ideally usage: npx tsx scripts/migrate-status.ts --dry

const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath) && !process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('ERROR: serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT not set.');
    process.exit(1);
}

if (!admin.apps.length) {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// --- Helpers ---
const asString = (val: any) => (typeof val === 'string' ? val : '');

// --- Main Logic ---
async function main() {
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry');

    if (!isDryRun) {
        console.log('⚠️  RUNNING IN WRITE MODE ⚠️');
        console.log('You have 5 seconds to cancel (Ctrl+C)...');
        await new Promise(r => setTimeout(r, 5000));
    } else {
        console.log('🧪 RUNNING IN DRY-RUN MODE');
    }

    console.log(`Scanning collection: ${COLLECTION_NAME}...`);

    const snapshot = await db.collection(COLLECTION_NAME).get();
    console.log(`Found ${snapshot.size} documents.`);

    let stats = {
        total: 0,
        alreadyValid: 0,
        migratedToReady: 0,
        migratedToDraft: 0,
        errors: 0
    };

    const batchSize = 500;
    let batch = db.batch();
    let operationCounter = 0;

    for (const doc of snapshot.docs) {
        stats.total++;
        const data = doc.data();
        const currentStatus = asString(data.status).trim().toLowerCase();
        const categoryVal = asString(data.category);
        const typeVal = asString(data.objectType);

        // Combine category and objectType for check (logic from publicObject.ts)
        const categoryCheck = (categoryVal || typeVal || '').toLowerCase();
        const isSoft = SOFT_CATEGORIES.some(c => categoryCheck.includes(c));

        let newStatus = 'draft';
        let needsUpdate = false;

        // Logic from publicObject.ts:
        // 1. Explicit status is respected
        if (['ready', 'active', 'published'].includes(currentStatus)) {
            // It's already functionally 'ready', but let's normalize to 'ready' if it's 'active'/'published'
            if (currentStatus !== 'ready') {
                newStatus = 'ready';
                needsUpdate = true;
            } else {
                stats.alreadyValid++;
                continue; // Already perfect
            }
        } else if (currentStatus === 'draft') {
            stats.alreadyValid++;
            continue;
        } else if (currentStatus === 'archived') {
            stats.alreadyValid++;
            continue;
        } else {
            // 2. Implicit fallback
            needsUpdate = true;
            if (isSoft) {
                newStatus = 'ready';
                stats.migratedToReady++;
            } else {
                newStatus = 'draft';
                stats.migratedToDraft++;
            }
        }

        if (needsUpdate) {
            console.log(`[${isDryRun ? 'DRY' : 'MIGRATE'}] ID: ${doc.id.padEnd(20)} | Status: "${currentStatus}" -> "${newStatus}" | Cat: "${categoryVal}"`);

            if (!isDryRun) {
                batch.update(doc.ref, { status: newStatus });
                operationCounter++;

                if (operationCounter >= batchSize) {
                    await batch.commit();
                    batch = db.batch();
                    operationCounter = 0;
                }
            }
        }
    }

    if (!isDryRun && operationCounter > 0) {
        await batch.commit();
    }

    console.log('\n--- Summary ---');
    console.log(`Total Objects:      ${stats.total}`);
    console.log(`Already Valid:      ${stats.alreadyValid}`);
    console.log(`To be Ready (Soft): ${stats.migratedToReady}`);
    console.log(`To be Draft (Other):${stats.migratedToDraft}`);
}

main().catch(console.error);
