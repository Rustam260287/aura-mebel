// pages/blog/index.tsx
import { GetStaticProps } from 'next';
import { getAdminDb } from '../../lib/firebaseAdmin';
import type { BlogPost, View } from '../../types';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

import { BlogListPage } from '../../components/BlogListPage'; // Используем ваш существующий компонент
import { Footer } from '../../components/Footer';

const Header = dynamic(() => import('../../components/Header').then(mod => mod.Header), { ssr: false });

interface BlogProps {
  posts: BlogPost[];
}

export default function BlogIndexPage({ posts }: BlogProps) {
  const router = useRouter();

  const handleNavigate = (view: View) => {
    if (view.page === 'blog-post') {
      router.push(`/blog/${view.postId}`);
    } else if (view.page === 'home') {
      router.push('/');
    }
  };

  return (
    <>
      <Header onStyleFinderClick={() => {}} />
      <main>
        <BlogListPage posts={posts} onNavigate={handleNavigate} />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const dbAdmin = getAdminDb();
  if (!dbAdmin) {
    return { props: { posts: [] } };
  }

  try {
    const blogSnapshot = await dbAdmin.collection('blog').orderBy('id', 'desc').get();
    const posts = blogSnapshot.docs.map(doc => doc.data());
    return {
      props: { posts: JSON.parse(JSON.stringify(posts)) },
    };
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return { props: { posts: [] } };
  }
};
