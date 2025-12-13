
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
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-6 py-12 text-center text-red-600">
                <h1 className="text-2xl font-bold mb-4">Ошибка</h1>
                <p>Не удалось загрузить статьи блога.</p>
            </main>
            <Footer />
        </div>
    );
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
      <main className="flex-grow">
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
        const snapshot = await db.collection('blog')
          .select('title', 'excerpt', 'imageUrl', 'createdAt', 'tags', 'status', 'author')
          .get();
        const allPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.get('title') ?? '',
          excerpt: doc.get('excerpt') ?? '',
          imageUrl: doc.get('imageUrl') ?? '',
          createdAt: doc.get('createdAt') ?? '',
          tags: doc.get('tags') ?? [],
          status: doc.get('status') ?? 'draft',
        })) as BlogPost[];
        
        const posts = allPosts
            .filter(post => post.status === 'published' || !post.status) // Обратная совместимость: если нет статуса - публикуем
            .sort((a, b) => {
                // Используем createdAt или id как дату
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.id).getTime();
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.id).getTime();
                return dateB - dateA;
            });

        return {
            props: {
                posts: JSON.parse(JSON.stringify(posts)),
            },
            revalidate: 60,
        };
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        return { props: { posts: [], error: "Failed to fetch posts" } };
    }
};
