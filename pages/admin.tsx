// pages/admin.tsx
import { GetServerSideProps } from 'next';
import { getAdminDb } from '../lib/firebaseAdmin';
import type { Product, BlogPost, View, ChatMessage } from '../types';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';

// AdminPage - это основной UI, он может быть большим, так что оставим его динамическим
const AdminPage = dynamic(() => import('../pages/AdminPage').then(mod => mod.default), { ssr: false });

interface AdminProps {
  initialProducts: Product[];
  initialBlogPosts: BlogPost[];
  // chatLogs пока оставим пустым
}

export default function AdminContainer({ initialProducts, initialBlogPosts }: AdminProps) {
  const router = useRouter();
  // Управляем состоянием на уровне этой страницы-контейнера
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);

  const handleNavigate = (view: View) => {
    // TODO: Добавить роутинг для других админских страниц, если они появятся
    router.push('/');
  };

  // TODO: Реализовать реальное взаимодействие с Firestore
  const handleUpdateProduct = useCallback(async (updatedProduct: Product) => {
    console.log("Updating product (client-side only for now):", updatedProduct.id);
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  }, []);

  const handleAddProduct = useCallback(async (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = { id: `new-${Date.now()}`, rating: 0, reviews: [], ...productData };
    console.log("Adding product (client-side only for now):", newProduct);
    setProducts(prev => [newProduct, ...prev]);
  }, []);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    console.log("Deleting product (client-side only for now):", productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  // Аналогичные хендлеры для блога
  const handleAddBlogPost = useCallback(async (postData: any) => {
    console.log("Adding blog post (client-side only for now):", postData);
  }, []);
  const handleUpdateBlogPost = useCallback(async (postData: any) => {
    console.log("Updating blog post (client-side only for now):", postData);
  }, []);
  const handleDeleteBlogPost = useCallback(async (postId: string) => {
    console.log("Deleting blog post (client-side only for now):", postId);
  }, []);


  return (
    <AdminPage 
        allProducts={products}
        blogPosts={blogPosts}
        chatLogs={[]} // Пока не загружаем
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

export const getServerSideProps: GetServerSideProps = async () => {
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
