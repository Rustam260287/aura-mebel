// pages/blog/[id].tsx
import { GetServerSideProps } from 'next';
import { getAdminDb } from '../../lib/firebaseAdmin';
import type { BlogPost, Product, View } from '../../types';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

import { BlogPostPage } from '../../components/BlogPostPage'; // Используем ваш компонент
import { Footer } from '../../components/Footer';

const Header = dynamic(() => import('../../components/Header').then(mod => mod.Header), { ssr: false });

interface PostPageProps {
  post?: BlogPost;
  allProducts: Product[]; // BlogPostPage ожидает все товары
  error?: string;
}

export default function PostPage({ post, allProducts, error }: PostPageProps) {
  const router = useRouter();

  if (error || !post) {
    return <div>Ошибка: {error || "Статья не найдена"}</div>;
  }

  const handleNavigate = (view: View) => {
    if (view.page === 'product') {
      router.push(`/products/${view.productId}`);
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <Header onNavigate={handleNavigate} onStyleFinderClick={() => {}} />
      <main>
        <BlogPostPage post={post} allProducts={allProducts} onNavigate={handleNavigate} />
      </main>
      <Footer onNavigate={handleNavigate} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params;
  const dbAdmin = getAdminDb();

  if (!dbAdmin) {
    return { props: { error: "DB connection failed" } };
  }

  try {
    const postDoc = await dbAdmin.collection('blog').doc(id as string).get();
    if (!postDoc.exists) {
      return { notFound: true };
    }

    const productsSnapshot = await dbAdmin.collection('products').get();
    const allProducts = productsSnapshot.docs.map(doc => doc.data());

    return {
      props: {
        post: JSON.parse(JSON.stringify(postDoc.data())),
        allProducts: JSON.parse(JSON.stringify(allProducts)),
      },
    };
  } catch (error) {
    return { props: { error: "Failed to fetch data" } };
  }
};
