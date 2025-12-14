
import { getAdminDb } from './firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Проверяет лимит запросов для идентификатора (userId или IP).
 * Использует Firestore для хранения счетчиков.
 * 
 * @param identifier Уникальный ID пользователя или IP
 * @param limit Максимальное количество запросов
 * @param windowMs Окно времени в миллисекундах (например, 3600000 = 1 час)
 * @param action Название действия (например, 'ai_redesign', 'chat_message')
 */
export async function checkRateLimit(
  identifier: string, 
  limit: number, 
  windowMs: number,
  action: string
): Promise<RateLimitResult> {
  const db = getAdminDb();
  if (!db) {
      console.warn("Rate limit skipped: DB not available");
      return { success: true, remaining: 1, reset: Date.now() + windowMs };
  }

  const now = Date.now();
  const docId = `${action}_${identifier}`; // Unique ID per action per user
  const docRef = db.collection('rate_limits').doc(docId);

  try {
    const result = await db.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      const data = doc.data();

      if (!data || data.resetTime < now) {
        // First request or window expired -> Reset counter
        t.set(docRef, {
          count: 1,
          resetTime: now + windowMs
        });
        return { success: true, remaining: limit - 1, reset: now + windowMs };
      }

      if (data.count >= limit) {
        // Limit exceeded
        return { success: false, remaining: 0, reset: data.resetTime };
      }

      // Increment counter
      t.update(docRef, {
        count: FieldValue.increment(1)
      });
      
      return { success: true, remaining: limit - data.count - 1, reset: data.resetTime };
    });

    return result;

  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail open (allow request) to avoid blocking users on DB errors
    return { success: true, remaining: 1, reset: now + windowMs };
  }
}
