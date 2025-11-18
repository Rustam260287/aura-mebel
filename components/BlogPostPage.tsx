// components/BlogPostPage.tsx
import React from 'react';
import type { BlogPost, Product, View } from '../types';
import { Button } from './Button';
import { ArrowLeftIcon } from './Icons';
import { ProductCard } from './ProductCard';
import Image from 'next/image';

interface BlogPostPageProps {
  post: BlogPost | null;
  allProducts: Product[];
  onNavigate: (view: View) => void;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({ post, allProducts, onNavigate }) => {

  if (!post) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold">Пост не найден</h1>
        <Button onClick={() => onNavigate({ page: 'blog-list' })} className="mt-4">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Назад к блогу
        </Button>
      </div>
    );
  }

  const relatedProducts = allProducts.filter(p => post.relatedProducts?.includes(p.id));

  return (
    <div className="bg-white">
      <div className="container mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => onNavigate({ page: 'blog-list' })} className="mb-8">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Назад к блогу
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <article>
              <h1 className="text-4xl md:text-5xl font-serif text-brand-brown mb-4 leading-tight">{post.title}</h1>
              {post.imageUrl && (
                <Image
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg my-8"
                    width={800}
                    height={500}
                />
              )}
              {/* Исправляем рендеринг HTML */}
              <div
                className="prose prose-lg lg:prose-xl max-w-none text-brand-charcoal/90 leading-relaxed space-y-6"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </article>
          </div>
          
          {relatedProducts.length > 0 && (
            <aside>
              <div className="sticky top-24">
                <h3 className="text-2xl font-serif text-brand-brown mb-6">Упомянутые товары</h3>
                <div className="space-y-6">
                  {relatedProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onProductSelect={(id) => onNavigate({ page: 'product', productId: id })}
                      onQuickView={() => {}}
                      onVirtualStage={() => {}}
                    />
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
