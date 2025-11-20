
// pages/admin.tsx
import { GetServerSideProps } from 'next';
import { getAdminDb } from '../lib/firebaseAdmin';
import type { Product, BlogPost, Order } from '../types';
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
  initialOrders: Order[];
}

function AdminContainer({ initialProducts, initialBlogPosts, initialOrders }: AdminContainerProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);

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

      if (!res.ok) throw new Error('Failed to update product');
      
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      addToast('Товар успешно обновлен', 'success');
    } catch (error) {
      console.error(error);
      addToast('Ошибка обновления товара', 'error');
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
      addToast('Товар успешно добавлен', 'success');
    } catch (error) {
      console.error(error);
      addToast('Ошибка добавления товара', 'error');
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

  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update order status');
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      addToast('Статус заказа обновлен', 'success');
    } catch (error) {
      console.error(error);
      addToast('Ошибка обновления статуса заказа', 'error');
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
          orders={orders}
          chatLogs={[]}
          onNavigate={handleNavigate}
          onUpdateProduct={handleUpdateProduct}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          onUpdateBlogPost={handleUpdateBlogPost}
          onDeleteBlogPost={handleDeleteBlogPost}
          onUpdateOrderStatus={handleUpdateOrderStatus}
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
    return { props: { initialProducts: [], initialBlogPosts: [], initialOrders: [], error: "Admin DB not initialized" } };
  }
  try {
    const productsSnapshot = await dbAdmin.collection('products').orderBy('name').get();
    const initialProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
    
    const blogSnapshot = await dbAdmin.collection('blog').orderBy('date', 'desc').get();
    const initialBlogPosts = blogSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BlogPost[];

    const ordersSnapshot = await dbAdmin.collection('orders').orderBy('createdAt', 'desc').get();
    const initialOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];

    return {
      props: { 
        initialProducts: JSON.parse(JSON.stringify(initialProducts)),
        initialBlogPosts: JSON.parse(JSON.stringify(initialBlogPosts)),
        initialOrders: JSON.parse(JSON.stringify(initialOrders)),
      },
    };
  } catch (error) {
    console.error("Error fetching admin data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { props: { initialProducts: [], initialBlogPosts: [], initialOrders: [], error: errorMessage } };
  }
};
