
// pages/objects/[id].tsx
import type { GetServerSideProps } from 'next';
import { getAdminDb, getAdminStorage } from '../../lib/firebaseAdmin';
import type { ObjectPublic } from '../../types';
import { useRouter } from 'next/router';
import { ObjectDetail } from '../../components/ObjectDetail';
import { Meta } from '../../components/Meta';
import { toPublicObject } from '../../lib/publicObject';
import { COLLECTIONS } from '../../lib/db/collections';

interface ObjectPageProps {
  object?: ObjectPublic;
  error?: string;
}

export default function ObjectPage({ object, error }: ObjectPageProps) {
  const router = useRouter();

  if (error) {
    // ... existing error UI ...
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-warm-white px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка загрузки объекта</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => router.push('/objects')} className="px-6 py-3 bg-soft-black text-white rounded-lg hover:bg-black transition-colors">Вернуться в галерею</button>
        </div>
      </div>
    );
  }

  if (!object) {
    // ... existing fallback ...
    return null;
  }

  // ... rest of component
  const descriptionText = object.description || '';
  const seoDescription = descriptionText.length > 160
    ? descriptionText.substring(0, 157) + '...'
    : descriptionText;

  const seoImage = (object.imageUrls && object.imageUrls.length > 0)
    ? object.imageUrls[0]
    : undefined;

  return (
    <>
      <Meta
        title={object.name}
        description={seoDescription || `Примерьте ${object.name} в вашем интерьере.`}
        image={seoImage}
        url={`/objects/${object.id}`}
      />
      <ObjectDetail
        object={object}
        onBack={() => router.back()}
      />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  if (!params?.id) return { props: { error: "Object ID not found." } };
  const { id } = params;

  // Разрешаем любые ID, так как теперь мы ищем и по slug
  const adminDb = getAdminDb();
  const adminStorage = getAdminStorage();

  if (!adminDb || !adminStorage) {
    return { props: { error: "Firebase Admin SDK initialization failed." } };
  }

  try {
    let objectDocSnapshot;
    const objectId = id as string;

    // 1. Попытка найти по ID документа (стандартный Firestore ID)
    const docRef = adminDb.collection(COLLECTIONS.objects).doc(objectId);
    objectDocSnapshot = await docRef.get();

    // 2. Если не найдено, пробуем найти по полю 'id' (slug из старого импорта)
    if (!objectDocSnapshot.exists) {
      console.log(`Object with doc ID ${objectId} not found. Searching by 'id' field...`);
      const querySnapshot = await adminDb.collection(COLLECTIONS.objects).where('id', '==', objectId).limit(1).get();

      if (!querySnapshot.empty) {
        objectDocSnapshot = querySnapshot.docs[0];
        // Важно: используем реальный ID документа для дальнейшей работы, 
        // но в объект запишем тот ID, который ожидает клиент (или реальный)
        // Лучше использовать реальный ID документа как основной.
      }
    }

    if (!objectDocSnapshot || !objectDocSnapshot.exists) {
      return { notFound: true };
    }

    const raw = objectDocSnapshot.data();
    const objectData = toPublicObject(raw, objectDocSnapshot.id);

    // Draft protection: Hide non-active objects in production
    const isDev = process.env.NODE_ENV === 'development';

    const SOFT_CATEGORIES = ['Мягкая мебель', 'sofa', 'Диваны', 'Кресла', 'Пуфы'];
    const category = objectData.category || '';
    const type = objectData.objectType || '';
    const isSoft = SOFT_CATEGORIES.some(c =>
      category.toLowerCase() === c.toLowerCase() ||
      type.toLowerCase() === c.toLowerCase()
    );

    if (!isDev) {
      if (objectData.status === 'archived') {
        return { notFound: true };
      }
      // Block drafts ONLY if they are NOT soft furniture
      // (We allow soft furniture drafts because they are effectively the "active" catalog now)
      if (!isSoft && objectData.status === 'draft') {
        return { notFound: true };
      }
    }

    // Обработка картинок
    if (Array.isArray(objectData.imageUrls)) {
      // ... existing image logic ...
      const bucket = adminStorage.bucket();
      objectData.imageUrls = await Promise.all(objectData.imageUrls.map(async (url) => {
        if (url && url.startsWith('gs://')) {
          const path = url.substring(url.indexOf('/', 5) + 1);
          try {
            const [signedUrl] = await bucket.file(path).getSignedUrl({
              action: 'read',
              expires: '03-09-2491'
            });
            return signedUrl;
          } catch (e) {
            return '/placeholder.svg';
          }
        }
        return url || '/placeholder.svg';
      }));
    } else {
      objectData.imageUrls = ['/placeholder.svg'];
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    return {
      props: {
        object: JSON.parse(JSON.stringify(objectData)),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error(`Error fetching object ${id}:`, errorMessage);
    return {
      props: { error: `Не удалось загрузить объект. Возможно, он был удален.` },
    };
  }
};
