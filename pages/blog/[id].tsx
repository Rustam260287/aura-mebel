
// pages/blog/[id].tsx
import { GetStaticPaths, GetStaticProps } from 'next';
import { getAdminDb, getAdminStorage } from '../../lib/firebaseAdmin'; // Обновленный импорт
import type { BlogPost, Product, View } from '../../types';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

import { BlogPostPage } from '../../components/BlogPostPage';
import { Footer } from '../../components/Footer';

const Header = dynamic(() => import('../../components/Header').then(mod => mod.Header), { ssr: false });

interface PostPageProps {
  post?: BlogPost;
  allProducts: Product[];
  error?: string;
}

export default function PostPage({ post, allProducts, error }: PostPageProps) {
  const router = useRouter();

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl text-red-500">Error loading data: {error}</h1>
      </div>
    );
  }

  const handleNavigate = (view: View) => {
    if (view.page === 'product') {
      router.push(`/products/${view.productId}`);
    } else if (view.page === 'blog-list') {
      router.push('/blog');
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <Header onStyleFinderClick={() => {}} />
      <main>
        <BlogPostPage post={post || null} allProducts={allProducts} onNavigate={handleNavigate} />
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
    const postsSnapshot = await adminDb.collection('blog').get();
    const paths = postsSnapshot.docs.map(doc => ({
        params: { id: doc.id },
    }));
    return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { params } = context;
  if (!params?.id) {
    return { props: { post: null, allProducts: [], error: "Post ID not found." } };
  }
  const { id } = params;
  const adminDb = getAdminDb(); // Вызываем функцию
  const adminStorage = getAdminStorage(); // Вызываем функцию

  if (!adminDb || !adminStorage) {
    // getAdminDb уже выведет ошибку в консоль, так что здесь просто возвращаем пропс
    return { props: { post: null, allProducts: [], error: "Firebase Admin SDK initialization failed." } };
  }

  try {
    const postDoc = await adminDb.collection('blog').doc(id as string).get();

    if (!postDoc.exists) {
      return { 
        props: { post: null, allProducts: [], error: "Post not found." } 
      };
    }

    const postData = { id: postDoc.id, ...postDoc.data() } as BlogPost;
    const bucket = adminStorage.bucket();

    if (postData.imageUrl && postData.imageUrl.startsWith('gs://')) {
        const path = postData.imageUrl.substring(postData.imageUrl.indexOf('/', 5) + 1);
        try {
            const [signedUrl] = await bucket.file(path).getSignedUrl({ action: 'read', expires: '03-09-2491' });
            postData.imageUrl = signedUrl;
        } catch(e) {
            if (e instanceof Error) {
                console.error(`Error getting signed URL for post image ${path}:`, e.message);
            } else {
                console.error(`An unknown error occurred while getting signed URL for post image ${path}`);
            }
            postData.imageUrl = '/placeholder.svg';
        }
    }

    const productsSnapshot = await adminDb.collection('products').get();
    const allProductsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];

    const allProducts = await Promise.all(allProductsData.map(async (product) => {
        if (Array.isArray(product.imageUrls)) {
            product.imageUrls = await Promise.all(product.imageUrls.map(async (url) => {
                if (url && url.startsWith('gs://')) { // Добавлена проверка
                    const path = url.substring(url.indexOf('/', 5) + 1);
                     try {
                        const [signedUrl] = await bucket.file(path).getSignedUrl({ action: 'read', expires: '03-09-2491' });
                        return signedUrl;
                    } catch(e) {
                        if (e instanceof Error) {
                            console.error(`Error getting signed URL for product image ${path}:`, e.message);
                        } else {
                            console.error(`An unknown error occurred while getting signed URL for product image ${path}`);
                        }
                        return '/placeholder.svg';
                    }
                }
                return url || '/placeholder.svg';
            }));
        } else {
            product.imageUrls = ['/placeholder.svg'];
        }
        delete (product as any).imageUrl;
        return product;
    }));


    return {
      props: {
        post: JSON.parse(JSON.stringify(postData)),
        allProducts: JSON.parse(JSON.stringify(allProducts)),
      },
    };
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { props: { post: null, allProducts: [], error: `Failed to fetch data: ${errorMessage}` } };
  }
};
