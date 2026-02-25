import { MetadataRoute } from 'next';
import { COLLECTIONS } from '../lib/db/collections';
import { getAdminDb } from '../lib/firebaseAdmin';

// Кэшируем генерацию sitemap на 1 час (3600 сек). 
// Firebase запросы не будут дергаться при каждом обращении поисковика.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aura-room.ru';

    // 1. Формируем статичные страницы
    const routes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/objects`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/collection`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/contacts`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    // 2. Запрашиваем объекты из Firestore
    const objects = await getAllObjects();

    // Формируем динамические маршруты мебели
    const objectRoutes: MetadataRoute.Sitemap = objects.map((obj) => ({
        url: `${baseUrl}/objects/${obj.slug}`,
        lastModified: obj.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8, // Мебель очень важна для SEO
    }));

    // Возвращаем склеенный массив (Next.js сам превратит его в XML)
    return [...routes, ...objectRoutes];
}

/**
 * Хелпер: Получение всех активных товаров из Firebase Admin SDK.
 * Работает только на сервере (в Node.js), что абсолютно безопасно для App Router.
 */
async function getAllObjects() {
    const db = getAdminDb();
    if (!db) {
        console.warn('[Sitemap] Database is not initialized');
        return [];
    }

    try {
        // Мы используем getAdminDb(), потому что sitemap.ts выполняется скриптом Next.js Server
        const snapshot = await db.collection(COLLECTIONS.objects)
            // Желательно показывать ботам только активные товары
            .where('status', '==', 'active')
            .get();

        return snapshot.docs.map(doc => {
            const data = doc.data();

            // Защита от кривых дат в БД (например пустые updatedAt)
            let updatedDate = new Date();
            if (data.updatedAt) {
                const parsed = new Date(data.updatedAt);
                if (!isNaN(parsed.getTime())) {
                    updatedDate = parsed;
                }
            }

            return {
                id: doc.id,
                slug: data.slug || doc.id, // Если нет slug (legacy), берем ID документа
                updatedAt: updatedDate,
            };
        });
    } catch (error) {
        console.error('[Sitemap] Failed to fetch objects:', error);
        return [];
    }
}
