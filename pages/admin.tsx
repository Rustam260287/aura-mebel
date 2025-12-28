
// pages/admin.tsx
import { GetServerSideProps } from 'next';
import { getAdminDb } from '../lib/firebaseAdmin';
import type { Product, BlogPost } from '../types';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { ToastProvider, useToast } from '../contexts/ToastContext';
import { AuthGuard } from '../components/AuthGuard';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { getAuth } from 'firebase/auth';

const AdminPage = dynamic(() => import('../components/AdminPage').then(mod => mod.AdminPage), { ssr: false });

interface AdminContainerProps {
  initialProducts: Product[];
  initialBlogPosts: BlogPost[];
}

function AdminContainer({ initialProducts, initialBlogPosts }: AdminContainerProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);

  const getAuthToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    throw new Error("User not authenticated");
  };

  const handleNavigate = () => {
    router.push('/');
  };

  const handleUpdateProduct = useCallback(async (updatedProduct: Product) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProduct),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData?.error || 'Failed to update product');
      }
      
      const savedProduct = responseData as Product;
      setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
      addToast('Объект успешно обновлен', 'success');
    } catch (error) {
      console.error(error);
      addToast('Ошибка обновления объекта', 'error');
    }
  }, [addToast]);

  const handleAddProduct = useCallback(async (productData: Omit<Product, 'id'>) => {
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (!res.ok) throw new Error('Failed to add product');
      
      const newProduct: Product = await res.json();
      setProducts(prev => [...prev, newProduct]);
      addToast('Объект успешно добавлен', 'success');
    } catch (error) {
      console.error(error);
      addToast('Ошибка добавления объекта', 'error');
    }
  }, [addToast]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete product');
      
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  const handleBulkGenerateSeo = useCallback(
    async (productIds: string[]) => {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/products/bulk-generate-seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Bulk SEO error:', data);
        throw new Error(data?.error || 'Failed to bulk-generate SEO');
      }
    },
    [],
  );

  const handleBulkGenerateDescriptions = useCallback(
    async (productIds: string[]) => {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/products/bulk-generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Bulk description error:', data);
        throw new Error(data?.error || 'Failed to bulk-generate descriptions');
      }
    },
    [],
  );

  const handleUpdateBlogPost = useCallback(async (updatedPost: BlogPost) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/blog/${updatedPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedPost),
      });

      if (!res.ok) throw new Error('Failed to update blog post');
      
      setBlogPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
      addToast('Пост успешно обновлен', 'success');
    } catch (error) {
      console.error(error);
      addToast('Ошибка обновления поста', 'error');
    }
  }, [addToast]);

  const handleDeleteBlogPost = useCallback(async (postId: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/blog/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to delete blog post');
      
      setBlogPosts(prev => prev.filter(p => p.id !== postId));
      addToast('Пост успешно удален', 'success');
    } catch (error) {
      console.error(error);
      addToast('Ошибка удаления поста', 'error');
    }
  }, [addToast]);

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
        onBulkGenerateSeo={handleBulkGenerateSeo}
        onBulkGenerateDescriptions={handleBulkGenerateDescriptions}
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
    // IMPORTANT: some legacy imports contain an `id` field in document data (slug),
    // so ensure the Firestore document ID always wins for editing/saving.
    const initialProducts = productsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Product[];
    
    // ИСПРАВЛЕНИЕ: Убираем orderBy('date'), так как поле может отсутствовать
    const blogSnapshot = await dbAdmin.collection('blog').get();
    const allBlogPosts = blogSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as BlogPost[];
    
    // Сортировка в памяти (по createdAt или id)
    const initialBlogPosts = allBlogPosts.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.id).getTime();
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.id).getTime();
        return dateB - dateA;
    });

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
