
import React, { memo } from 'react';
import type { BlogPost, Product, View } from '@/types'; // ИСПРАВЛЕНО
import { ArrowLeftIcon } from './Icons';
import { Button } from './Button';
import Image from 'next/image';
import { ProductCard } from './ProductCard';

interface BlogPostPageProps {
  post: BlogPost;
  relatedProducts: Product[];
  onNavigate: (view: View) => void;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = memo(({ post, relatedProducts, onNavigate }) => {

  return (
    <div className="bg-white">
      <div className="relative h-96">
        <Image 
          src={post.imageUrl || '/placeholder.svg'} 
          alt={post.title}
          className="object-cover"
          fill
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white">
          <h1 className="text-4xl md:text-6xl font-serif">{post.title}</h1>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Button variant="ghost" onClick={() => onNavigate({ page: 'blog-list' })} className="mb-8">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Назад к статьям
        </Button>
        <article 
          className="prose lg:prose-xl max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t">
            <h2 className="text-3xl font-serif text-brand-brown mb-8 text-center">Товары, упомянутые в статье</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
          </section>
        )}
      </div>
    </div>
  );
});

BlogPostPage.displayName = 'BlogPostPage';
