
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// --- ИСПРАВЛЕНО: Используем правильное имя бакета ---
const BUCKET_NAME = 'aura-mebel-7ec96.firebasestorage.app';

export const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  let serviceAccount;

  // 1. Сначала пробуем получить ключ из переменной окружения
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("Firebase Admin SDK: Инициализация из переменной окружения FIREBASE_SERVICE_ACCOUNT...");
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error("Критическая ошибка: не удалось распарсить FIREBASE_SERVICE_ACCOUNT.", e);
    }
  }

  // Фолбэк на хардкод, если переменные не подгрузились
  if (!serviceAccount) {
    console.log("Firebase Admin SDK: Использование встроенного ключа (fallback)...");
    serviceAccount = {
      type: "service_account",
      project_id: "aura-mebel-7ec96",
      private_key_id: "7319a4a34bcaf603f96c30d1f2245eb66f84a9da",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDMQr1yfRduCnlb\nxbr+WHOwJFmb1Fzh9I8hPHWbC08eRXUolAbDDtnhX9aXn2V2UdVBVrz4OhDnRcAY\nuBUqrZZmy6NTBLHKNPWq8cyOzqmMXj9ggs4mkxZuTI4MhCUMCtBdoz5zaL32kY+N\nvI271pgk7jHDxue0dTnN5deIMU+TkbbZ16RlNhC0zwru3YmpceDetmIUsxF5Ci5s\nO7ms2Uwpf4re5mZA5Dw6xiBZC4eQDl3BzSFU1O/Y+NnheEDoV4teQ9szIt7qJJMw\nhHy+T7j+1sj2+BN33p6FWa+xBbvsg1ra1OOIltvMixV64knBYZGnixkdsK9+Qhc3\n1yRpr7BJAgMBAAECggEAV2qSqF5HujTqVi/LxNF3BWGxJeMfMyaWYMt+q3GOFS71\non2jXTRMY8s/zBkP87C2+yUTb4puNIQh35JcoKy0qt6o0b03F4pNvzCHcnCYmDW3\nmuawMksNtPu3aTzenAY+wWw9LGgdsFoAXVDeOY7wAxIboyVLgWwP5oHgmW09GLJm\nd7oUlDyiL8hJ+Uv2f+dTLb3PHSMKIj1IY9aaUjXkcBzgpQS0DeCMse0R/JHW2SIo\nH/RxoQK1LcPVnD8u90EhpEi6hcNOtwPDzRvk14HR3oM+MUSWly+qXX1JedaLCjDZ\n0BlAGlTQlYhLqyx2HTNQd6D0/biT7dZgY2m0Xere/wKBgQDtfByx4dFux63O5xsf\n2PenfmFl5X3pNIyzHBYJdEG3C56xL8gVtConVHWgFehvWdmUlYwpUNChtb2/xkGD\nrK4FSYFkC3zzfYGu4gkHSknVZLx4FHQHXvkQsQrCMN9QQY/PU6I066oWb2TbI8Y5\nVtE5LKy0Y1aYyxz9ryA50CQkEwKBgQDcL4SXTO7EUtTw5cYz+3pkaUgOt9DNzbiS\nNT6N74/jAnmeDSLlW2t8NBhzXAPs44/2HEe+wD9gOB06rmBYKWI9azlzn2abmRUM\nr+3LFSNOxvCjdJxMy0xJZTs6A6OLVm7QkpVzvZ2F924vrzEw/Ym8YlbwBhJseZy/\nmEadfsSNswKBgQCcrFix8eydTRaZfVYjuJwJ4BKZisF6bLS2JT1Ul2ITRJM5CfDS\ngL2enNXM+ycQ7xHgOJjzWOGLDb9VGZJ3MCDOVCQMwJd6e75mhbC3Iod7RK4h+jxh\n8IIYRPR4EI4DAH3DpcVJbIAVtP+wovVPNrtpINP/Xdnvi3Bg3HxCJ9LwCQKBgQCE\nTV0bWJPDjY377eTpiTriqMwuY87oSquT1sBuorrPicYv7O7B5+uu5tKmRmzpY1c2\nZ4nImVW7aBxQDUVA1CT+iLYtvmL2LcaTKAb3Vw0vIaSoYsIj9qgxFc2/rz4O1HGj\ni+CXeiDzxVgE+PzS1hV0B5b7hHp/iZdhHIuZyPkrtwKBgD0CLERjwHUKy5cW4uQC\nIHvysdphLtHFcpvb7uvwKZvr1PzsB8WMO8X0BkFbdmjdGLm9fhzjSFiu+10iuuSw\nnqKcjuMQzP89Dor10a4nUXM4zc0gkLEkFyFpBU3RKb4zKv4/5BJRZa4C8om4dv3u\nmX5k02IHDR2QrWZqkgbPxkU3\n-----END PRIVATE KEY-----\n",
      client_email: "firebase-adminsdk-fbsvc@aura-mebel-7ec96.iam.gserviceaccount.com",
    };
  }

  if (serviceAccount) {
    // Продолжаем инициализацию с serviceAccount
  } else {
    console.log("Firebase Admin SDK: Инициализация из файла serviceAccountKey.json...");
    try {
      const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
        serviceAccount = JSON.parse(serviceAccountFile);
      } else {
        // Cloud Build / Cloud Run / Cloud Functions may rely on ADC.
        console.warn(`Firebase Admin SDK: serviceAccountKey.json не найден (${serviceAccountPath}), пробуем Application Default Credentials...`);
        return admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          storageBucket: BUCKET_NAME,
        });
      }
    } catch (error: any) {
      console.error('Критическая ошибка при чтении ключа:', error.message);
      // Пробрасываем ошибку дальше, чтобы Next.js показал её
      throw error;
    }
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: BUCKET_NAME,
  });
};

export const getAdminDb = () => {
  if (admin.apps.length === 0) {
    initializeFirebaseAdmin();
  }
  return admin.firestore();
};

export const getAdminStorage = () => {
  if (admin.apps.length === 0) {
    initializeFirebaseAdmin();
  }
  return admin.storage();
};

// --- НОВАЯ ФУНКЦИЯ ---
export const getAdminAuth = () => {
  if (admin.apps.length === 0) {
    initializeFirebaseAdmin();
  }
  return admin.auth();
};

export const db = getAdminDb();
