import React, { useState, memo, useEffect } from 'react';
import type { Product, BlogPost, View, ChatMessage, AdminView, Order } from '../types';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminProducts } from '../components/admin/AdminProducts';
import { AdminBlog } from '../components/admin/AdminBlog';
import { AdminOrders } from '../components/admin/AdminOrders';
import { ProductEditModal } from '../components/ProductEditModal';
import { BlogEditModal } from '../components/BlogEditModal';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminChatAnalytics } from '../components/admin/AdminChatAnalytics';

interface AdminPageProps {
  allProducts: Product[];
  blogPosts: BlogPost[];
  orders: Order[];
  chatLogs: ChatMessage[][];
  onNavigate: (view: View) => void;
  onUpdateProduct: (updatedProduct: Product) => Promise<void>;
  onAddProduct: (productData: Omit<Product, 'id'>) => Promise<void>;
  onUpdateBlogPost: (updatedPost: BlogPost) => Promise<void>;
  onDeleteBlogPost: (postId: string) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  onBulkGenerateSeo: (ids: string[]) => Promise<void>;
  onBulkUpdatePrices: (ids: string[], percent: number) => Promise<void>;
  onBulkGenerateDescriptions: (ids: string[]) => Promise<void>;
}

const AdminPageComponent: React.FC<AdminPageProps> = ({ 
  allProducts, 
  blogPosts,
  orders,
  chatLogs,
  onNavigate,
  onUpdateProduct,
  onAddProduct,
  onUpdateBlogPost,
  onDeleteBlogPost,
  onDeleteProduct,
  onUpdateOrderStatus,
  onBulkGenerateSeo,
  onBulkUpdatePrices,
  onBulkGenerateDescriptions,
}) => {
  const [adminView, setAdminView] = useState<AdminView>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentBlogPosts, setCurrentBlogPosts] = useState(blogPosts);

  useEffect(() => {
      setCurrentBlogPosts(blogPosts);
  }, [blogPosts]);

  const renderContent = () => {
    switch (adminView) {
      case 'dashboard':
        return (
          <AdminDashboard
            products={allProducts}
            posts={currentBlogPosts}
            onEditProduct={setEditingProduct}
            onAutoFixProblems={onBulkGenerateDescriptions}
          />
        );
      case 'products':
        return (
          <AdminProducts
            products={allProducts}
            onEditProduct={setEditingProduct}
            onDeleteProduct={onDeleteProduct}
            onAddProduct={() => setIsAddModalOpen(true)}
            onBulkGenerateSeo={onBulkGenerateSeo}
            onBulkUpdatePrices={onBulkUpdatePrices}
            onBulkGenerateDescriptions={onBulkGenerateDescriptions}
          />
        );
      case 'blog':
        return <AdminBlog 
                  posts={currentBlogPosts}
                  setBlogPosts={setCurrentBlogPosts}
                  onEditPost={setEditingBlogPost}
                  onDeletePost={onDeleteBlogPost}
                  onUpdatePost={onUpdateBlogPost}
                />;
      case 'orders':
        return <AdminOrders orders={orders} onUpdateStatus={onUpdateOrderStatus} />;
      case 'chat-analytics':
        return <AdminChatAnalytics chatLogs={chatLogs} />;
      default:
        return null;
    }
  };
  
  const handleSetView = (view: AdminView) => {
    setAdminView(view);
    setIsSidebarOpen(false); // Close sidebar on navigation
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <AdminSidebar 
        activeView={adminView} 
        setView={handleSetView} 
        onNavigate={onNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="md:pl-64 flex flex-col flex-1">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8">
          {renderContent()}
        </main>
      </div>
      
      {isAddModalOpen && (
        <ProductEditModal
          isOpen={isAddModalOpen}
          product={null}
          onClose={() => setIsAddModalOpen(false)}
          onSave={async (productData) => {
            await onAddProduct(productData as Omit<Product, 'id'>);
            setIsAddModalOpen(false);
          }}
        />
      )}
      {editingProduct && (
        <ProductEditModal
          isOpen={!!editingProduct}
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={async (updatedProduct) => {
            await onUpdateProduct(updatedProduct as Product);
            setEditingProduct(null);
          }}
        />
      )}
      {editingBlogPost && (
        <BlogEditModal
          post={editingBlogPost}
          onClose={() => setEditingBlogPost(null)}
          onSave={async (updatedPost) => {
            await onUpdateBlogPost(updatedPost);
            // We update local state in AdminPage, but AdminBlog also has local state?
            // Actually AdminBlog receives state via props now? 
            // In renderContent, we pass 'posts={currentBlogPosts}' and 'setBlogPosts'.
            // But we also update 'currentBlogPosts' here.
            // Let's rely on 'blogPosts' prop update from parent (pages/admin.tsx) which updates 'initialBlogPosts' ?
            // No, pages/admin.tsx has local state 'blogPosts'.
            // When onUpdateBlogPost is called, pages/admin.tsx updates its state.
            // And that new state is passed down to AdminPage as 'blogPosts'.
            // So we need a useEffect to sync props to local state if we keep local state here.
            setEditingBlogPost(null);
          }}
        />
      )}
    </div>
  );
};

export const AdminPage = memo(AdminPageComponent);
