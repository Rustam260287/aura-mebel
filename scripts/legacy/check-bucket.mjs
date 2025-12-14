
import admin from 'firebase-admin';
import fs from 'fs';

const SERVICE_ACCOUNT_PATH = './service-account-key.json'; 

try {
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    // admin.storage() возвращает сервис Storage, у него нет getBuckets.
    // Нам нужен bucket() без аргументов (вернет дефолтный) или доступ к cloud storage client.
    // Но admin.storage() в nodejs sdk это обертка.
    // Правильный способ получить список:
    
    // В старых версиях admin.storage() возвращал объект с bucket().
    // Но сам bucket() возвращает объект Bucket из @google-cloud/storage.
    // А вот получить список бакетов можно через client (но он скрыт).
    
    // Попробуем просто угадать, обратившись к дефолтному
    
    console.log('Project ID:', serviceAccount.project_id);
    const possibleNames = [
        `${serviceAccount.project_id}.appspot.com`,
        `${serviceAccount.project_id}.firebasestorage.app`,
        `staging.${serviceAccount.project_id}.appspot.com`
    ];
    
    for (const name of possibleNames) {
        console.log(`Проверяю бакет: ${name}`);
        const bucket = admin.storage().bucket(name);
        try {
            const [exists] = await bucket.exists();
            if (exists) {
                console.log(`✅ БАКЕТ СУЩЕСТВУЕТ: ${name}`);
            } else {
                console.log(`❌ Бакет не найден: ${name}`);
            }
        } catch (e) {
             console.log(`❌ Ошибка доступа к ${name}: ${e.message}`);
        }
    }

} catch (error) {
    console.error('❌ Ошибка:', error);
}
