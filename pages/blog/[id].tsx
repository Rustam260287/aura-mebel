
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

        let relatedProducts: Product[] = [];
        if (post.relatedProducts && post.relatedProducts.length > 0) {
            const productPromises = post.relatedProducts.map(productId => 
                db.collection('products').doc(productId).get()
            );
            const productDocs = await Promise.all(productPromises);
            relatedProducts = productDocs
                .filter(doc => doc.exists)
                .map(doc => ({ id: doc.id, ...doc.data() } as Product));
        }

        return {
            props: {
                post: JSON.parse(JSON.stringify(post)),
                relatedProducts: JSON.parse(JSON.stringify(relatedProducts)),
            },
            revalidate: 60 * 10, // 10 минут
        };
    } catch (error) {
        console.error(`Error fetching blog post ${params.id}:`, error);
        return { props: { error: "Failed to fetch data" } };
    }
};
