
// pages/blog/index.tsx
import { GetStaticProps } from 'next';
import { getAdminDb } from '../../lib/firebaseAdmin';
import type { BlogPost, View } from '../../types';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { BlogListPage } from '../../components/BlogListPage';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

interface BlogIndexProps {
  posts: BlogPost[];
  error?: string;
}

export default function BlogIndex({ posts, error }: BlogIndexProps) {
  const router = useRouter();

  if (error) {
    return <div>Ошибка загрузки постов.</div>;
  }
  
  const handleNavigate = (view: View) => {
    if (view.page === 'blog-post') {
      router.push(`/blog/${view.postId}`);
    } else {
      router.push(`/${view.page}`);
    }
  };

  return (
    <>
      <Header />
      <main>
        <BlogListPage posts={posts} onNavigate={handleNavigate} />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
    const db = getAdminDb();
    if (!db) {
        return { props: { posts: [], error: "Admin DB not initialized" } };
    }
    try {
        const snapshot = await db.collection('blog').orderBy('date', 'desc').get();
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BlogPost[];
        return {
            props: {
                posts: JSON.parse(JSON.stringify(posts)),
            },
            revalidate: 60,
        };
    } catch (error) {
        return { props: { posts: [], error: "Failed to fetch posts" } };
    }
};
