
import type { GetServerSideProps } from 'next';
import { getAdminDb } from '../../lib/firebaseAdmin';
import type { JournalEntry, ObjectPublic, View } from '../../types';
import { useRouter } from 'next/router';
import { JournalEntryPage } from '../../components/JournalEntryPage';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Meta } from '../../components/Meta';
import { toPublicObject } from '../../lib/publicObject';
import { COLLECTIONS } from '../../lib/db/collections';

interface PostPageProps {
  post?: JournalEntry;
  relatedObjects?: ObjectPublic[];
  error?: string;
}

export default function PostPage({ post, relatedObjects, error }: PostPageProps) {
  const router = useRouter();

  if (error || !post) {
    return <div className="text-center py-20 text-red-500">Ошибка: {error || 'Пост не найден'}</div>;
  }

  const handleNavigate = (view: View) => {
    if (view.page === 'object') {
      router.push(`/objects/${view.objectId}`);
      return;
    }
    if (view.page === 'journal-list' || view.page === 'journal') {
      router.push('/journal');
      return;
    }
    router.push(`/${view.page}`);
  };

  return (
    <>
      <Meta title={post.title} description={post.excerpt} image={post.imageUrl} />
      <Header />
      <main>
        <JournalEntryPage post={post} relatedObjects={relatedObjects || []} onNavigate={handleNavigate} />
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
    const db = getAdminDb();
    if (!db || !params?.id) return { notFound: true };

    try {
        const postId = params.id as string;
        const postDoc = await db.collection('blog').doc(postId).get();
        if (!postDoc.exists) {
            return { notFound: true };
        }
        const post = { id: postDoc.id, ...postDoc.data() } as JournalEntry;

        // --- УМНЫЙ ПОИСК ОБЪЕКТОВ ИЗ ТЕКСТА ---
        const content = post.content || '';
        // Ищем теги [OBJECT: Название]
        const objectMatches = content.match(/\[(OBJECT): (.*?)\]/g);
        
        let relatedObjects: ObjectPublic[] = [];
        
        // Получаем объекты (оптимизация: кэшировать бы, но это build time)
	        const objectsSnapshot = await db.collection(COLLECTIONS.objects)
	          .select('name', 'imageUrls', 'objectType', 'category')
	          .limit(100)
	          .get();
        const allObjects = objectsSnapshot.docs.map(doc => toPublicObject(doc.data(), doc.id));

        if (objectMatches) {
            const objectNames = objectMatches.map(m => m.replace(/^\[(OBJECT):\s*/i, '').replace(']', '').trim());
            
            // Ищем совпадения по названию (нечеткий поиск)
            relatedObjects = allObjects.filter(o => 
                objectNames.some(name => 
                    o.name.toLowerCase().includes(name.toLowerCase()) || 
                    name.toLowerCase().includes(o.name.toLowerCase())
                )
            ).slice(0, 4); // Берем до 4 объектов
        }

        // Если не нашли объекты, берем случайные 3
        if (relatedObjects.length === 0) {
             relatedObjects = allObjects.sort(() => 0.5 - Math.random()).slice(0, 3);
        }

        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        return {
            props: {
                post: JSON.parse(JSON.stringify(post)),
                relatedObjects: JSON.parse(JSON.stringify(relatedObjects)),
            },
        };
    } catch (error) {
        console.error(`Error fetching journal entry ${params.id}:`, error);
        return { props: { error: "Failed to fetch data" } };
    }
};
