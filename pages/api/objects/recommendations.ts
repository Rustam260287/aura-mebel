
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';
import { toPublicObject } from '../../../lib/publicObject';
import { COLLECTIONS } from '../../../lib/db/collections';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { style } = req.query;
  const db = getAdminDb();

  try {
    // Логика подбора объектов под стиль
    // В идеале объекты должны иметь теги стилей.
    // Пока берем объекты из подходящих категорий и фильтруем (если бы были теги).
    
    const categories = ['Мягкая мебель', 'Гостиная', 'Спальни']; // Основные категории
    
    // Получаем выборку объектов (limit 30, чтобы было из чего выбрать случайно)
    // Firestore не умеет делать random query эффективно, поэтому берем выборку и шафлим.
    const snapshot = await db.collection(COLLECTIONS.objects)
        .where('category', 'in', categories)
        .limit(30)
        .get();

    if (snapshot.empty) {
        return res.json({ objects: [] });
    }

    const allObjects = snapshot.docs.map(doc => toPublicObject(doc.data(), doc.id));

    // --- Простая фильтрация по стилю (если в описании есть слова) ---
    // Это улучшит релевантность
    if (typeof style === 'string') {
        const styleLower = style.toLowerCase();
        // Маппинг английских стилей на русские ключевые слова
        const keywords: Record<string, string[]> = {
            'modern': ['современн', 'модерн', 'стильн', 'хай-тек'],
            'minimalist': ['минимал', 'лаконичн', 'прост'],
            'classic': ['классик', 'традицион', 'роскош'],
            'scandinavian': ['сканди', 'скандинав', 'уют', 'светл'],
            'industrial': ['лофт', 'индустриал', 'металл'],
            'bohemian': ['бохо', 'ярк', 'уют'],
        };
        
        const targetKeywords = keywords[styleLower] || [];
        
        if (targetKeywords.length > 0) {
            // Сортируем: сначала те, у кого в описании или названии есть ключевые слова
            allObjects.sort((a, b) => {
                const textA = ((a.name || '') + (a.description || '')).toLowerCase();
                const textB = ((b.name || '') + (b.description || '')).toLowerCase();
                
                const scoreA = targetKeywords.some(k => textA.includes(k)) ? 1 : 0;
                const scoreB = targetKeywords.some(k => textB.includes(k)) ? 1 : 0;
                
                return scoreB - scoreA;
            });
            
            // Если нашли совпадения, берем топ, иначе оставляем рандом
        }
    }

    // Если не сортировали по релевантности (или все равны), перемешиваем топ-10
    // Чтобы каждый раз были разные
    const topSelection = allObjects.slice(0, 10).sort(() => 0.5 - Math.random());
    const selected = topSelection.slice(0, 4); // Возвращаем 4 объекта

    res.status(200).json({ objects: selected });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    // Не падаем, возвращаем пустой массив, чтобы не ломать UI
    res.status(200).json({ objects: [] });
  }
}
