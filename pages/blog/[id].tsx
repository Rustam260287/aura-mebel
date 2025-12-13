
import { GetStaticPaths, GetStaticProps } from 'next';
import { getAdminDb } from '../../lib/firebaseAdmin';
import type { BlogPost, Product, View } from '../../types';
import { useRouter } from 'next/router';
import { BlogPostPage } from '../../components/BlogPostPage';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { SEO } from '../../components/SEO';

interface PostPageProps {
  post?: BlogPost;
  relatedProducts?: Product[];
  error?: string;
}

export default function PostPage({ post, relatedProducts, error }: PostPageProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Загрузка...</div>;
  }

  if (error || !post) {
    return <div className="text-center py-20 text-red-500">Ошибка: {error || 'Пост не найден'}</div>;
  }

  const handleNavigate = (view: View) => {
    if (view.page === 'product') {
      router.push(`/products/${view.productId}`);
    } else if (view.page === 'blog-list') {
      router.push('/blog');
    } else {
      router.push(`/${view.page}`);
    }
  };

  return (
    <>
      <SEO title={post.title} description={post.excerpt} image={post.imageUrl} />
      <Header />
      <main>
        <BlogPostPage post={post} relatedProducts={relatedProducts || []} onNavigate={handleNavigate} />
      </main>
      <Footer />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
    const adminDb = getAdminDb();
    if (!adminDb) {
        return { paths: [], fallback: 'blocking' };
    }
    const snapshot = await adminDb.collection('blog').get();
    const paths = snapshot.docs.map(doc => ({
        params: { id: doc.id },
    }));
    return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const db = getAdminDb();
    if (!db || !params?.id) {
        return { notFound: true };
    }

    try {
        const postId = params.id as string;
        const postDoc = await db.collection('blog').doc(postId).get();
        if (!postDoc.exists) {
            return { notFound: true };
        }
        const post = { id: postDoc.id, ...postDoc.data() } as BlogPost;

        // --- УМНЫЙ ПОИСК ТОВАРОВ ИЗ ТЕКСТА ---
        const content = post.content || '';
        // Ищем теги [PRODUCT: Название]
        const productMatches = content.match(/\[PRODUCT: (.*?)\]/g);
        
        let relatedProducts: Product[] = [];
        
        // Получаем товары (оптимизация: кэшировать бы, но это build time)
        const productsSnapshot = await db.collection('products')
          .select('name', 'imageUrls', 'category')
          .limit(100)
          .get();
        const allProducts = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.get('name') ?? '',
          imageUrls: doc.get('imageUrls') ?? [],
          category: doc.get('category') ?? '',
        }) as Product);

        if (productMatches) {
            const productNames = productMatches.map(m => m.replace('[PRODUCT: ', '').replace(']', '').trim());
            
            // Ищем совпадения по названию (нечеткий поиск)
            relatedProducts = allProducts.filter(p => 
                productNames.some(name => 
                    p.name.toLowerCase().includes(name.toLowerCase()) || 
                    name.toLowerCase().includes(p.name.toLowerCase())
                )
            ).slice(0, 4); // Берем до 4 товаров
        }

        // Если AI не нашел товары или не вставил теги, берем просто товары из той же категории (если бы она была у поста) или рандом
        if (relatedProducts.length === 0) {
             // Берем случайные 3
             relatedProducts = allProducts.sort(() => 0.5 - Math.random()).slice(0, 3);
        }

        return {
            props: {
                post: JSON.parse(JSON.stringify(post)),
                relatedProducts: JSON.parse(JSON.stringify(relatedProducts)),
            },
            revalidate: 60 * 60, // 1 час
        };
    } catch (error) {
        console.error(`Error fetching blog post ${params.id}:`, error);
        return { props: { error: "Failed to fetch data" } };
    }
};
