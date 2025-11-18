
// pages/blog/[id].tsx
import { GetStaticPaths, GetStaticProps } from 'next';
import { getAdminDb } from '../../lib/firebaseAdmin';
import type { BlogPost, Product, View } from '../../types';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { BlogPostPage } from '../../components/BlogPostPage';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

interface PostPageProps {
  post?: BlogPost;
  allProducts: Product[];
  error?: string;
}

export default function PostPage({ post, allProducts, error }: PostPageProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Загрузка...</div>;
  }

  if (error || !post) {
    return <div>Ошибка загрузки поста.</div>;
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
      <Header />
      <main>
        <BlogPostPage post={post} allProducts={allProducts} onNavigate={handleNavigate} />
      </main>
      <Footer />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
    const adminDb = getAdminDb();
    if (!adminDb) {
        return { paths: [], fallback: true };
    }
    const snapshot = await adminDb.collection('blog').get();
    const paths = snapshot.docs.map(doc => ({
        params: { id: doc.id },
    }));
    return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const db = getAdminDb();
    if (!db || !params?.id) {
        return { notFound: true };
    }

    try {
        const postDoc = await db.collection('blog').doc(params.id as string).get();
        if (!postDoc.exists) {
            return { notFound: true };
        }
        const post = { id: postDoc.id, ...postDoc.data() } as BlogPost;

        const productsSnapshot = await db.collection('products').get();
        const allProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];

        return {
            props: {
                post: JSON.parse(JSON.stringify(post)),
                allProducts: JSON.parse(JSON.stringify(allProducts)),
            },
            revalidate: 60,
        };
    } catch (error) {
        return { props: { allProducts: [], error: "Failed to fetch data" } };
    }
};
