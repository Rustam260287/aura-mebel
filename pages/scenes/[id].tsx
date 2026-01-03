import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getAdminDb, getAdminStorage } from '../../lib/firebaseAdmin';
import { COLLECTIONS } from '../../lib/db/collections';
import type { ObjectPublic, ScenePresetPublic } from '../../types';
import { toPublicObject } from '../../lib/publicObject';
import { toScenePresetPublic } from '../../lib/scenePreset';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Meta } from '../../components/Meta';
import { SceneDetail } from '../../components/SceneDetail';

interface ScenePageProps {
  scene?: ScenePresetPublic;
  objects?: ObjectPublic[];
  error?: string;
}

export default function ScenePage({ scene, objects, error }: ScenePageProps) {
  const router = useRouter();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Header />
        <div className="text-center py-20 px-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка загрузки сцены</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/objects')}
            className="px-6 py-3 bg-brand-brown text-white rounded-lg hover:bg-brand-brown/90 transition-colors"
          >
            Вернуться в галерею
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Header />
        <div className="text-center py-20 px-4">
          <h1 className="text-3xl font-serif text-brand-charcoal mb-4">Сцена не найдена</h1>
          <p className="text-gray-500 mb-8">К сожалению, запрашиваемая сцена не существует или была удалена.</p>
          <button
            onClick={() => router.push('/objects')}
            className="px-6 py-3 bg-brand-brown text-white rounded-lg hover:bg-brand-brown/90 transition-colors"
          >
            Перейти в галерею
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const seoDescription = scene.description
    ? scene.description.length > 160
      ? scene.description.substring(0, 157) + '...'
      : scene.description
    : `Примерьте сцену «${scene.title}» в вашем интерьере.`;

  return (
    <>
      <Meta title={scene.title} description={seoDescription} image={scene.coverImageUrl} url={`/scenes/${scene.id}`} />
      <Header />
      <main className="bg-white min-h-screen">
        <SceneDetail scene={scene} objects={objects || []} onBack={() => router.back()} />
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  const id = typeof params?.id === 'string' ? params.id : '';
  if (!id) return { props: { error: 'Scene ID not found.' } };

  const adminDb = getAdminDb();
  const adminStorage = getAdminStorage();
  if (!adminDb || !adminStorage) return { props: { error: 'Firebase Admin SDK initialization failed.' } };

  try {
    const docRef = adminDb.collection(COLLECTIONS.scenePresets).doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return { notFound: true };

    const scene = toScenePresetPublic(snap.data(), snap.id);

    const objectIds = Array.from(new Set((scene.objects || []).map((o) => o.objectId).filter(Boolean)));
    const refs = objectIds.map((oid) => adminDb.collection(COLLECTIONS.objects).doc(oid));
    const docs = refs.length > 0 ? await adminDb.getAll(...refs) : [];

    const objects: ObjectPublic[] = docs
      .filter((d) => d.exists)
      .map((d) => toPublicObject(d.data(), d.id));

    // Best-effort image URL signing for gs:// links (same as object detail page).
    const bucket = adminStorage.bucket();
    for (const obj of objects) {
      if (!Array.isArray(obj.imageUrls)) continue;
      obj.imageUrls = await Promise.all(
        obj.imageUrls.map(async (url) => {
          if (url && url.startsWith('gs://')) {
            const path = url.substring(url.indexOf('/', 5) + 1);
            try {
              const [signedUrl] = await bucket.file(path).getSignedUrl({
                action: 'read',
                expires: '03-09-2491',
              });
              return signedUrl;
            } catch (e) {
              console.error(`Error getting signed URL for ${path}:`, e instanceof Error ? e.message : e);
              return '/placeholder.svg';
            }
          }
          return url || '/placeholder.svg';
        }),
      );
    }

    if (!scene.coverImageUrl) {
      const firstObjectId = scene.objects?.[0]?.objectId;
      const firstObject = firstObjectId ? objects.find((o) => o.id === firstObjectId) : undefined;
      const cover = firstObject?.imageUrls?.[0];
      if (cover) scene.coverImageUrl = cover;
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    return {
      props: {
        scene: JSON.parse(JSON.stringify(scene)),
        objects: JSON.parse(JSON.stringify(objects)),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Error fetching scene ${id}:`, errorMessage);
    return {
      props: { error: 'Не удалось загрузить сцену. Попробуйте позже.' },
    };
  }
};
