import React, { useState, memo } from 'react';
import type { Product, BlogPost, View, ChatMessage } from '../types';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminProducts } from './admin/AdminProducts';
import { AdminBlog } from './admin/AdminBlog';
import { ProductEditModal } from '../components/ProductEditModal';
import { BlogEditModal } from '../components/BlogEditModal';
import { AdminHeader } from './admin/AdminHeader';
import { AdminChatAnalytics } from './admin/AdminChatAnalytics';

interface AdminPageProps {
  allProducts: Product[];
  blogPosts: BlogPost[];
  chatLogs: ChatMessage[][];
  onNavigate: (view: View) => void;
  onUpdateProduct: (updatedProduct: Product) => Promise<void>;
  onAddProduct: (productData: Omit<Product, 'id'>) => Promise<void>;
  onAddBlogPost: (postData: Omit<BlogPost, 'id' | 'imageUrl'> & { imageBase64: string }) => Promise<void>;
  onUpdateBlogPost: (updatedPost: BlogPost) => Promise<void>;
  onDeleteBlogPost: (postId: string) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
}

type AdminView = 'dashboard' | 'products' | 'blog' | 'chat-analytics';

const AdminPageComponent: React.FC<AdminPageProps> = ({ 
  allProducts, 
  blogPosts,
  chatLogs,
  onNavigate,
  onUpdateProduct,
  onAddProduct,
  onAddBlogPost,
  onUpdateBlogPost,
  onDeleteBlogPost,
  onDeleteProduct,
}) => {
  const [adminView, setAdminView] = useState<AdminView>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (adminView) {
      case 'dashboard':
        return <AdminDashboard products={allProducts} posts={blogPosts} />;
      case 'products':
        return <AdminProducts 
                  products={allProducts} 
                  onEditProduct={setEditingProduct}
                  onDeleteProduct={onDeleteProduct}
                  onAddProduct={() => setIsAddModalOpen(true)}
                />;
      case 'blog':
        return <AdminBlog 
                  posts={blogPosts}
                  allProducts={allProducts}
                  onAddPost={onAddBlogPost}
                  onEditPost={setEditingBlogPost}
                  onDeletePost={onDeleteBlogPost}
                />;
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
            setEditingBlogPost(null);
          }}
        />
      )}
    </div>
  );
};

export const AdminPage = memo(AdminPageComponent);
