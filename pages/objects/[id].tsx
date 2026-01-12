
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
  debugData?: any; // Temporary debug field
}

export default function ObjectPage({ object, error, debugData }: ObjectPageProps) {
  const router = useRouter();

  if (debugData) {
    return (
      <div className="p-8 bg-white min-h-screen font-mono text-sm overflow-auto">
        <h1 className="text-xl font-bold mb-4 text-red-600">PRODUCTION DEBUG MODE</h1>
        <p className="mb-2"><strong>Error:</strong> {error}</p>
        <pre className="bg-gray-100 p-4 border rounded">{JSON.stringify(debugData, null, 2)}</pre>
        <button onClick={() => router.push('/objects')} className="mt-8 px-4 py-2 bg-black text-white rounded">Back</button>
      </div>
    )
  }

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
  const objectId = id as string;

  console.log(`[SSR] Fetching object: ${objectId}`);

  const adminDb = getAdminDb();
  const adminStorage = getAdminStorage();

  if (!adminDb || !adminStorage) {
    console.error('[SSR] Firebase Admin Init Failed');
    return {
      props: {
        error: "Firebase Admin SDK initialization failed.",
        debugData: { stage: 'init', adminDb: !!adminDb, adminStorage: !!adminStorage }
      }
    };
  }

  try {
    let objectDocSnapshot;

    // 1. Попытка найти по ID документа
    const docRef = adminDb.collection(COLLECTIONS.objects).doc(objectId);
    objectDocSnapshot = await docRef.get();
    let foundMethod = 'docId';

    // 2. Если не найдено, пробуем найти по полю 'id'
    if (!objectDocSnapshot.exists) {
      console.log(`[SSR] Object ${objectId} not found by ID. Searching by slug...`);
      const querySnapshot = await adminDb.collection(COLLECTIONS.objects).where('id', '==', objectId).limit(1).get();

      if (!querySnapshot.empty) {
        objectDocSnapshot = querySnapshot.docs[0];
        foundMethod = 'slug';
      }
    }

    if (!objectDocSnapshot || !objectDocSnapshot.exists) {
      console.warn(`[SSR] Object ${objectId} NOT FOUND in Firestore.`);
      // DEBUG MODE: Return debug info logic instead of 404
      return {
        props: {
          error: "Object Not Found in DB",
          debugData: {
            id: objectId,
            stage: 'lookup',
            foundMethod: null,
            collection: COLLECTIONS.objects,
            projectId: process.env.FIREBASE_PROJECT_ID || 'undefined'
          }
        }
      };
      // return { notFound: true };
    }

    const raw = objectDocSnapshot.data();
    const objectData = toPublicObject(raw, objectDocSnapshot.id);

    console.log(`[SSR] Object found: ${objectData.id}, status: ${objectData.status}`);

    const isDev = process.env.NODE_ENV === 'development';

    // Strict Status Check - Debugging
    // Previously: if (!isDev && objectData.status !== 'ready')
    // Now blocked only explicit draft/archived
    if (!isDev && (objectData.status === 'draft' || objectData.status === 'archived')) {
      console.warn(`[SSR] Object ${objectId} blocked by status: ${objectData.status}`);
      return {
        props: {
          error: "Object Blocked by Status",
          debugData: {
            id: objectId,
            status: objectData.status,
            isDev,
            stage: 'status_check'
          }
        }
      };
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
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[SSR] Error: ${msg}`);
    return {
      props: {
        error: `Internal Error: ${msg}`,
        debugData: {
          id: objectId,
          stage: 'catch',
          error: msg
        }
      }
    }
  }
};
