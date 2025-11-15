
import React from 'react';
import type { Product, BlogPost } from '../../types';

interface AdminDashboardProps {
  products: Product[];
  posts: BlogPost[];
}

const StatCard: React.FC<{ title: string; value: string | number; children: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className="bg-brand-cream p-4 rounded-full">
            {children}
        </div>
        <div className="ml-4">
            <p className="text-lg font-semibold text-brand-charcoal">{title}</p>
            <p className="text-3xl font-serif text-brand-brown">{value}</p>
        </div>
    </div>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, posts }) => {
  return (
    <div>
      <h1 className="text-3xl font-serif text-brand-brown mb-8">Аналитика</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Всего товаров" value={products.length}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
        </StatCard>
        <StatCard title="Статей в блоге" value={posts.length}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
        </StatCard>
        {/* Placeholder for more stats */}
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center text-gray-400">
            <p>Скоро здесь будут графики продаж</p>
        </div>
      </div>
      {/* Future sections for charts */}
    </div>
  );
};
