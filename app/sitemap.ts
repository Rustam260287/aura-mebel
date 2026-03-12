import { MetadataRoute } from 'next';
import { COLLECTIONS } from '../lib/db/collections';
import { listPublicCollectionDocuments } from '../lib/firestore/publicFetch';
import { toPublicObject } from '../lib/publicObject';
import { isProductionReadyObject } from '../lib/catalog/publicReadiness';

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
        { url: `${baseUrl}/wizard`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${baseUrl}/redesign`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${baseUrl}/saved`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.4 },
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
    try {
        const documents = await listPublicCollectionDocuments(COLLECTIONS.objects);

        return documents
            .map((doc) => {
                const publicObject = toPublicObject(doc, String(doc.id || ''));
                if (!isProductionReadyObject(publicObject)) return null;

                // Защита от кривых дат в БД (например пустые updatedAt)
                let updatedDate = new Date();
                if (typeof doc.updatedAt === 'string' || typeof doc.updateTime === 'string') {
                    const parsed = new Date(String(doc.updatedAt || doc.updateTime));
                    if (!isNaN(parsed.getTime())) {
                        updatedDate = parsed;
                    }
                }

                return {
                    id: String(doc.id || ''),
                    slug: String(doc.slug || doc.id || ''),
                    updatedAt: updatedDate,
                };
            })
            .filter((value): value is { id: string; slug: string; updatedAt: Date } => Boolean(value));
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[Sitemap] Skipping dynamic objects: ${message}`);
        return [];
    }
}
