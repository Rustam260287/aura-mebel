import React, { useState, memo } from 'react';
import type { Product, BlogPost, View, ChatMessage } from '../types';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminProducts } from '../components/admin/AdminProducts';
import { AdminBlog } from '../components/admin/AdminBlog';
import { ProductEditModal } from '../components/ProductEditModal';
import { BlogEditModal } from '../components/BlogEditModal';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminChatAnalytics } from '../components/admin/AdminChatAnalytics';

interface AdminPageProps {
  allProducts: Product[];
  blogPosts: BlogPost[];
  chatLogs: ChatMessage[][];
  onNavigate: (view: View) => void;
  onUpdateProduct: (updatedProduct: Product) => Promise<void>;
  onAddProduct: (productData: Omit<Product, 'id'>) => Promise<void>;
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
  onUpdateBlogPost,
  onDeleteBlogPost,
  onDeleteProduct,
}) => {
  const [adminView, setAdminView] = useState<AdminView>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentBlogPosts, setCurrentBlogPosts] = useState(blogPosts);

  const renderContent = () => {
    switch (adminView) {
      case 'dashboard':
        return <AdminDashboard products={allProducts} posts={currentBlogPosts} />;
      case 'products':
        return <AdminProducts 
                  products={allProducts} 
                  onEditProduct={setEditingProduct}
                  onDeleteProduct={onDeleteProduct}
                  onAddProduct={() => setIsAddModalOpen(true)}
                />;
      case 'blog':
        return <AdminBlog 
                  posts={currentBlogPosts}
                  setBlogPosts={setCurrentBlogPosts}
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
            const updatedPosts = currentBlogPosts.map(p => p.id === updatedPost.id ? updatedPost : p);
            setCurrentBlogPosts(updatedPosts);
            setEditingBlogPost(null);
          }}
        />
      )}
    </div>
  );
};

export const AdminPage = memo(AdminPageComponent);
