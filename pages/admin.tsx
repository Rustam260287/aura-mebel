
// pages/admin.tsx
import { GetServerSideProps } from 'next';
import { getAdminDb } from '../lib/firebaseAdmin';
import type { Product, BlogPost } from '../types';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthGuard } from '../components/AuthGuard';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';

const AdminPage = dynamic(() => import('../components/AdminPage').then(mod => mod.AdminPage), { ssr: false });

interface AdminContainerProps {
  initialProducts: Product[];
  initialBlogPosts: BlogPost[];
}

function AdminContainer({ initialProducts, initialBlogPosts }: AdminContainerProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [products] = useState<Product[]>(initialProducts);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);

  const handleNavigate = () => {
    router.push('/');
  };

  const handleUpdateProduct = useCallback(async () => {
    // ...
  }, []);

  const handleAddProduct = useCallback(async () => {
    // ...
  }, []);

  const handleDeleteProduct = useCallback(async () => {
    // ...
  }, []);

  const handleUpdateBlogPost = useCallback(async () => {
    // ...
  }, []);

  const handleDeleteBlogPost = useCallback(async () => {
    // ...
  }, []);

  return (
    <>
      <div className="absolute top-4 right-4 z-20">
        <Button onClick={logout} variant="outline">Выйти</Button>
      </div>
      <AdminPage 
          allProducts={products}
          blogPosts={blogPosts}
          chatLogs={[]}
          onNavigate={handleNavigate}
          onUpdateProduct={handleUpdateProduct}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          onUpdateBlogPost={handleUpdateBlogPost}
          onDeleteBlogPost={handleDeleteBlogPost}
      />
    </>
  );
}

export default function AdminPageContainer(props: AdminContainerProps) {
  return (
    <AuthGuard>
      <ToastProvider>
        <AdminContainer {...props} />
      </ToastProvider>
    </AuthGuard>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const dbAdmin = getAdminDb();
  if (!dbAdmin) {
    return { props: { initialProducts: [], initialBlogPosts: [], error: "Admin DB not initialized" } };
  }
  try {
    const productsSnapshot = await dbAdmin.collection('products').orderBy('name').get();
    const initialProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
    
    const blogSnapshot = await dbAdmin.collection('blog').orderBy('date', 'desc').get();
    const initialBlogPosts = blogSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BlogPost[];

    return {
      props: { 
        initialProducts: JSON.parse(JSON.stringify(initialProducts)),
        initialBlogPosts: JSON.parse(JSON.stringify(initialBlogPosts)),
      },
    };
  } catch (error) {
    console.error("Error fetching admin data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { props: { initialProducts: [], initialBlogPosts: [], error: errorMessage } };
  }
};
