
import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { style } = req.query;
  const db = getAdminDb();

  try {
    // Логика подбора товаров под стиль
    // В идеале товары должны иметь теги стилей. 
    // Пока берем товары из подходящих категорий и фильтруем (если бы были теги)
    // Сейчас просто возвращаем случайные товары из категорий для гостиной/мягкой мебели.
    
    const categories = ['Мягкая мебель', 'Гостиная', 'Спальни']; // Основные категории
    
    // Получаем выборку товаров (limit 30, чтобы было из чего выбрать случайно)
    // Firestore не умеет делать random query эффективно, поэтому берем выборку и шафлим.
    const snapshot = await db.collection('products')
        .where('category', 'in', categories)
        .limit(30)
        .get();

    if (snapshot.empty) {
        return res.json({ products: [] });
    }

    let allProducts = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
    })) as any[];

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
            allProducts.sort((a, b) => {
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
    const topSelection = allProducts.slice(0, 10).sort(() => 0.5 - Math.random());
    const selected = topSelection.slice(0, 4); // Возвращаем 4 товара

    res.status(200).json({ products: selected });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    // Не падаем, возвращаем пустой массив, чтобы не ломать UI
    res.status(200).json({ products: [] });
  }
}
