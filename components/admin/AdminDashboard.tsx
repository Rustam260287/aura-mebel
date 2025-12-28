
import React from 'react';
import type { Product, BlogPost } from '../../types';
import { JobManager } from './JobManager';

interface AdminDashboardProps {
  products: Product[];
  posts: BlogPost[];
  onAutoFixProblems?: (ids: string[]) => Promise<void>;
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

const buildProblemReason = (product: Product) => {
  const reasons: string[] = [];
  if (!product.imageUrls || product.imageUrls.length === 0) {
    reasons.push('нет фото');
  }
  const descLength = (product.description || '').replace(/\s+/g, ' ').trim().length;
  if (!product.description || descLength < 100) {
    reasons.push('короткое описание');
  }
  if (!product.model3dUrl && !product.model3dIosUrl) {
    reasons.push('нет 3D');
  }
  return reasons.join(', ');
};

const hasStrangeDescription = (description?: string) => {
  if (!description) return false;
  return /уточните.+консультант/iu.test(description);
};

interface ProblemListProps {
  title: string;
  products: Product[];
  emptyLabel: string;
  onEditProduct?: (product: Product) => void;
  getReason: (product: Product) => string;
}

const ProblemList: React.FC<
  ProblemListProps & { onAutoFixProblemsClick?: (ids: string[]) => void }
> = ({ title, products, emptyLabel, onEditProduct, getReason, onAutoFixProblemsClick }) => (
  <div className="bg-white p-5 rounded-lg shadow-md">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-brand-charcoal">{title}</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          {products.length}
        </span>
      </div>
      {products.length > 0 && onAutoFixProblemsClick && (
        <button
          type="button"
          onClick={() => onAutoFixProblemsClick(products.map(p => p.id))}
          className="text-xs font-semibold text-brand-brown hover:text-brand-charcoal px-3 py-1 rounded-full border border-brand-brown/30 hover:border-brand-charcoal/40 transition-colors"
        >
          Исправить автоматически
        </button>
      )}
    </div>
    {products.length === 0 ? (
      <p className="text-sm text-gray-400">{emptyLabel}</p>
    ) : (
      <ul className="divide-y divide-gray-100">
        {products.slice(0, 8).map((product) => (
          <li key={product.id} className="py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-brand-charcoal truncate">{product.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {getReason(product)}
              </p>
            </div>
            {onEditProduct && (
              <button
                type="button"
                onClick={() => onEditProduct(product)}
                className="text-xs font-semibold text-brand-brown hover:text-brand-charcoal px-3 py-1 rounded-full border border-brand-brown/30 hover:border-brand-charcoal/40 transition-colors"
              >
                Открыть
              </button>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const AdminDashboard: React.FC<
  AdminDashboardProps & { onEditProduct?: (product: Product) => void }
> = ({ products, posts, onEditProduct, onAutoFixProblems }) => {
  const problemProducts = products.filter((p) => {
    const hasImages = p.imageUrls && p.imageUrls.length > 0;
    const has3D = Boolean(p.model3dUrl || p.model3dIosUrl);
    const descLength = (p.description || '').replace(/\s+/g, ' ').trim().length;
    return !hasImages || !has3D || descLength < 100;
  });

  const strangeProducts = products.filter((p) => {
    return hasStrangeDescription(p.description);
  });

  return (
    <div>
      <div className="mb-8">
        <JobManager />
      </div>

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <ProblemList
          title="Проблемные товары"
          products={problemProducts}
          emptyLabel="Все товары выглядят хорошо — 3D, фото и тексты на месте."
          onEditProduct={onEditProduct}
          getReason={buildProblemReason}
          onAutoFixProblemsClick={
            onAutoFixProblems
              ? (ids: string[]) => {
                  onAutoFixProblems(ids).catch(err => {
                    console.error('Auto-fix problems failed', err);
                  });
                }
              : undefined
          }
        />
        <ProblemList
          title="Странные данные"
          products={strangeProducts}
          emptyLabel="Подозрительных описаний не найдено."
          onEditProduct={onEditProduct}
          getReason={(product) => {
            const reasons: string[] = [];
            if (hasStrangeDescription(product.description)) {
              reasons.push('текст: «уточните у консультанта»');
            }
            return reasons.join(', ');
          }}
        />
      </div>
    </div>
  );
};
