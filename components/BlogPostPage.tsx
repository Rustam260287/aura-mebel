
import React, { memo, useMemo } from 'react';
import type { BlogPost, Product, View } from '../types';
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

  const cleanContent = useMemo(() => {
      if (!post.content) return '';
      return post.content.replace(/\[PRODUCT:.*?\]/g, '');
  }, [post.content]);

  return (
    <div className="bg-[#FBF9F4] min-h-screen">
      {/* Hero Header */}
      <div className="relative h-[60vh] min-h-[400px] bg-brand-charcoal">
        <Image 
          src={post.imageUrl || '/placeholder.svg'} 
          alt={post.title}
          className="object-cover opacity-90"
          fill
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-12 container mx-auto pointer-events-none">
            {/* Top Bar - Button (pointer-events-auto to make it clickable) */}
            <div className="pt-4 pointer-events-auto self-start">
                <Button 
                    variant="ghost" 
                    onClick={() => onNavigate({ page: 'blog-list' })} 
                    className="text-white hover:bg-white/20 backdrop-blur-sm transition-all"
                >
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Журнал
                </Button>
            </div>
            
            {/* Bottom Info */}
            <div className="max-w-4xl animate-fade-in-up pointer-events-auto">
                <div className="flex items-center gap-3 mb-4 text-xs font-bold tracking-[0.2em] text-white/80 uppercase">
                    <span>{(post.tags && post.tags[0]) || 'Статья'}</span>
                    <span className="w-1 h-1 bg-white rounded-full"></span>
                    <span>{new Date(post.createdAt || Date.now()).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-tight mb-6 drop-shadow-lg">
                    {post.title}
                </h1>
                {post.author && (
                    <div className="flex items-center gap-3 text-white/90">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-serif">L</div>
                        <span className="text-sm font-medium tracking-wide">Автор: {post.author}</span>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-16 max-w-3xl">
        <article 
          className="prose prose-lg prose-brown max-w-none 
          prose-headings:font-serif prose-headings:font-normal prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:font-light
          prose-a:text-brand-brown prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-brand-brown prose-blockquote:text-xl prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:text-brand-charcoal prose-blockquote:bg-white prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-lg prose-blockquote:shadow-sm
          first-letter:float-left first-letter:text-5xl first-letter:pr-4 first-letter:font-serif first-letter:text-brand-brown"
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        />

        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-24 pt-16 border-t border-brand-brown/10">
            <h2 className="text-3xl font-serif text-brand-charcoal mb-2 text-center">Выбор редакции</h2>
            <p className="text-center text-gray-500 mb-12 italic">Предметы интерьера из этой статьи</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {relatedProducts.slice(0, 2).map(product => (
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
