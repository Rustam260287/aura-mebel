// pages/admin.tsx
import { GetStaticProps } from 'next';
import { getAdminDb } from '../lib/firebaseAdmin';
import type { Product, BlogPost, View } from '../types';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';

const AdminPage = dynamic(() => import('../components/AdminPage').then(mod => mod.AdminPage), { ssr: false });

interface AdminProps {
  initialProducts: Product[];
  initialBlogPosts: BlogPost[];
}

export default function AdminContainer({ initialProducts, initialBlogPosts }: AdminProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);

  const handleNavigate = (view: View) => {
    router.push('/');
  };

  // TODO: Реализовать реальное взаимодействие с Firestore через API
  const handleUpdateProduct = useCallback(async (updatedProduct: Product) => {}, []);
  const handleAddProduct = useCallback(async (productData: Omit<Product, 'id'>) => {}, []);
  const handleDeleteProduct = useCallback(async (productId: string) => {}, []);
  const handleUpdateBlogPost = useCallback(async (postData: any) => {}, []);
  const handleDeleteBlogPost = useCallback(async (postId: string) => {}, []);
  const handleAddBlogPost = useCallback(async (postData: any) => {}, []);

  return (
    <AdminPage 
        allProducts={products}
        blogPosts={blogPosts}
        chatLogs={[]}
        onNavigate={handleNavigate}
        onUpdateProduct={handleUpdateProduct}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
        onAddBlogPost={handleAddBlogPost}
        onUpdateBlogPost={handleUpdateBlogPost}
        onDeleteBlogPost={handleDeleteBlogPost}
    />
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const dbAdmin = getAdminDb();
  if (!dbAdmin) {
    return { props: { initialProducts: [], initialBlogPosts: [] } };
  }
  try {
    const productsSnapshot = await dbAdmin.collection('products').get();
    const initialProducts = productsSnapshot.docs.map(doc => doc.data());
    const blogSnapshot = await dbAdmin.collection('blog').get();
    const initialBlogPosts = blogSnapshot.docs.map(doc => doc.data());
    return {
      props: { 
        initialProducts: JSON.parse(JSON.stringify(initialProducts)),
        initialBlogPosts: JSON.parse(JSON.stringify(initialBlogPosts)),
      },
    };
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return { props: { initialProducts: [], initialBlogPosts: [] } };
  }
};
