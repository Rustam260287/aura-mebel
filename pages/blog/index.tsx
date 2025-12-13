
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { BlogPost, View } from '../../types';
import { BlogListPage } from '../../components/BlogListPage';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { BlogListSkeleton } from '../../components/BlogListSkeleton';

const BLOG_CACHE_TTL = 45_000;
let blogListCache: { posts: BlogPost[]; timestamp: number } | null = null;

export default function BlogIndex() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let isActive = true;
    if (blogListCache && Date.now() - blogListCache.timestamp < BLOG_CACHE_TTL) {
      setPosts(blogListCache.posts);
      setLoading(false);
      return () => {
        isActive = false;
      };
    }

    const controller = new AbortController();
    setError(null);

    const fetchList = async () => {
      try {
        const res = await fetch('/api/blog/list', { signal: controller.signal });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || 'Не удалось загрузить статьи');
        }
        const data = await res.json();
        if (!isActive) return;
        const freshPosts = data.posts ?? [];
        setPosts(freshPosts);
        blogListCache = {
          posts: freshPosts,
          timestamp: Date.now(),
        };
      } catch (err) {
        if (!isActive) return;
        console.error('Blog list fetch failed', err);
        setError(err instanceof Error ? err.message : 'Не удалось загрузить статьи блога.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchList();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const handleNavigate = (view: View) => {
    if (view.page === 'blog-post') {
      router.push(`/blog/${view.postId}`);
    } else {
      router.push(`/${view.page}`);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-6 py-12 text-center text-red-600">
          <h1 className="text-2xl font-bold mb-4">Ошибка</h1>
          <p>{error}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-grow">
        {loading ? (
          <BlogListSkeleton />
        ) : (
          <BlogListPage posts={posts} onNavigate={handleNavigate} />
        )}
      </main>
      <Footer />
    </>
  );
}
