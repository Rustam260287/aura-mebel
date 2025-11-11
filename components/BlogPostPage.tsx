
import React, { memo } from 'react';
import type { BlogPost, Product, View } from '../types';
import { ProductCard } from './ProductCard';
import { Button } from './Button';
import { ArrowLeftIcon } from './Icons';

interface BlogPostPageProps {
  post: BlogPost | null; // Разрешаем post быть null
  allProducts: Product[];
  onNavigate: (view: View) => void;
}

const BlogPostPageComponent: React.FC<BlogPostPageProps> = ({ post, allProducts, onNavigate }) => {
  
  // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ---
  // Если пост не существует (равен null), мы немедленно выводим сообщение
  // и прекращаем выполнение компонента, чтобы избежать ошибок.
  if (!post) {
    return (
      <div className="bg-white">
        <div className="container mx-auto px-6 py-24 text-center">
            <h1 className="text-4xl font-serif text-brand-brown mb-4">Пост не найден</h1>
            <p className="text-lg text-brand-charcoal/80 mb-8">К сожалению, мы не смогли найти запрошенную вами статью.</p>
            <Button variant="primary" onClick={() => onNavigate({ page: 'blog-list' })}>
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Вернуться ко всем статьям
            </Button>
        </div>
      </div>
    );
  }

  // Этот код будет выполняться только если 'post' не равен null.
  const relatedProducts = allProducts.filter(p => post.relatedProducts?.includes(p.id));

  const handleProductSelect = (productId: string) => {
    onNavigate({ page: 'product', productId });
  };
  
  return (
    <div className="bg-white">
        <div className="container mx-auto px-6 py-12">
            <div className="max-w-4xl mx-auto">
                <Button variant="ghost" onClick={() => onNavigate({ page: 'blog-list' })} className="mb-8">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Назад в блог
                </Button>

                <article>
                    <h1 className="text-4xl md:text-5xl font-serif text-brand-brown mb-4 leading-tight">{post.title}</h1>
                    {post.imageUrl && (
                      <img 
                          src={post.imageUrl} 
                          alt={post.title}
                          className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg my-8"
                      />
                    )}
                    <div 
                        className="prose prose-lg lg:prose-xl max-w-none text-brand-charcoal/90 leading-relaxed space-y-6"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </article>

                {relatedProducts.length > 0 && (
                    <section className="mt-20 pt-12 border-t border-gray-200">
                        <h2 className="text-3xl font-serif text-brand-charcoal mb-8 text-center">Товары из статьи</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
                            {relatedProducts.map(product => (
                                <ProductCard 
                                    key={product.id}
                                    product={product}
                                    onProductSelect={handleProductSelect}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    </div>
  );
};

export const BlogPostPage = memo(BlogPostPageComponent);
