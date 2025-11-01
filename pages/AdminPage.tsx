

import React, { useState } from 'react';
import type { Product, BlogPost, View } from '../types';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminProducts } from './admin/AdminProducts';
import { AdminBlog } from './admin/AdminBlog';
import { ProductEditModal } from '../components/ProductEditModal';

interface AdminPageProps {
  allProducts: Product[];
  blogPosts: BlogPost[];
  onNavigate: (view: View) => void;
  onUpdateProduct: (updatedProduct: Product) => void;
  onUpdatePosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
  onDeleteProduct: (productId: number) => void;
}

type AdminView = 'dashboard' | 'products' | 'blog';

export const AdminPage: React.FC<AdminPageProps> = ({ 
  allProducts, 
  blogPosts, 
  onNavigate,
  onUpdateProduct,
  onUpdatePosts,
  onDeleteProduct,
}) => {
  const [adminView, setAdminView] = useState<AdminView>('dashboard');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const renderContent = () => {
    switch (adminView) {
      case 'dashboard':
        return <AdminDashboard products={allProducts} posts={blogPosts} />;
      case 'products':
        return <AdminProducts 
                  products={allProducts} 
                  onEditProduct={(product) => setEditingProduct(product)} 
                  onDeleteProduct={onDeleteProduct}
                />;
      case 'blog':
        return <AdminBlog 
                  posts={blogPosts} 
                  setPosts={onUpdatePosts}
                  allProducts={allProducts}
                />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex">
        <AdminSidebar activeView={adminView} setView={setAdminView} onNavigate={onNavigate} />
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={(updatedProduct) => {
            onUpdateProduct(updatedProduct);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};