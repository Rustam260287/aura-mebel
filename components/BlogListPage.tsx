
import React, { useState, memo } from 'react';
import type { BlogPost, View } from '../types';
import { Pagination } from './Pagination';
import Image from 'next/image';

interface BlogListPageProps {
  posts: BlogPost[];
  onNavigate: (view: View) => void;
}

const POSTS_PER_PAGE = 9;

const BlogListPageComponent: React.FC<BlogListPageProps> = ({ posts, onNavigate }) => {
    const [currentPage, setCurrentPage] = useState(1);
    
    // Сортировка: новые первыми (уже сделана на сервере, но на всякий случай)
    // Выделяем первый пост как "Главную тему номера"
    const heroPost = posts[0];
    const otherPosts = posts.slice(1);

    const totalPages = Math.ceil(otherPosts.length / POSTS_PER_PAGE);
    
    const currentPosts = otherPosts.slice(
        (currentPage - 1) * POSTS_PER_PAGE,
        currentPage * POSTS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (posts.length === 0) {
        return (
             <div className="container mx-auto px-6 py-24 text-center">
                <h2 className="text-3xl font-serif text-brand-charcoal mb-4">Журнал Labelcom</h2>
                <p className="text-gray-500">Статьи готовятся к публикации...</p>
            </div>
        )
    }

    return (
        <div className="bg-[#FBF9F4] min-h-screen">
            {/* Header Section */}
            <div className="py-16 text-center border-b border-brand-brown/10">
                <span className="text-brand-brown font-bold tracking-[0.3em] text-xs uppercase mb-4 block">Est. 2024</span>
                <h1 className="text-5xl md:text-7xl font-serif text-brand-charcoal mb-6">Labelcom Journal</h1>
                <p className="text-lg text-brand-charcoal/60 font-light italic max-w-xl mx-auto">
                    "Искусство жить красиво. Тренды, дизайн и философия уюта."
                </p>
            </div>

            <div className="container mx-auto px-6 py-12">
                {/* Hero Post */}
                {heroPost && currentPage === 1 && (
                    <div 
                        className="group mb-16 cursor-pointer grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
                        onClick={() => onNavigate({ page: 'blog-post', postId: heroPost.id })}
                    >
                        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl shadow-premium">
                            <Image 
                                src={heroPost.imageUrl || '/placeholder.svg'} 
                                alt={heroPost.title} 
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                fill
                                priority
                            />
                        </div>
                        <div className="lg:pl-8 text-center lg:text-left">
                            <div className="flex items-center justify-center lg:justify-start gap-4 mb-4 text-xs font-bold tracking-widest text-brand-brown uppercase">
                                <span>Главная тема</span>
                                <div className="w-8 h-[1px] bg-brand-brown"></div>
                                <span>{(heroPost.tags && heroPost.tags[0]) || 'Тренды'}</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-serif text-brand-charcoal mb-6 leading-tight group-hover:text-brand-brown transition-colors">
                                {heroPost.title}
                            </h2>
                            <p className="text-lg text-gray-600 mb-8 font-light leading-relaxed line-clamp-3">
                                {heroPost.excerpt}
                            </p>
                            <span className="inline-block border-b border-brand-charcoal pb-1 text-sm font-medium tracking-wide uppercase group-hover:border-brand-brown group-hover:text-brand-brown transition-all">
                                Читать статью
                            </span>
                        </div>
                    </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                    {currentPosts.map((post, idx) => (
                        <div 
                            key={post.id} 
                            className="group cursor-pointer flex flex-col h-full"
                            onClick={() => onNavigate({ page: 'blog-post', postId: post.id })}
                        >
                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg mb-6 bg-gray-100">
                                <Image 
                                    src={post.imageUrl || '/placeholder.svg'} 
                                    alt={post.title} 
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                            </div>
                            <div className="flex flex-col flex-grow">
                                <div className="flex items-center gap-2 mb-3 text-[10px] font-bold tracking-widest text-brand-brown/70 uppercase">
                                    <span>{(post.tags && post.tags[0]) || 'Дизайн'}</span>
                                    <span>•</span>
                                    <span>{new Date(post.createdAt || Date.now()).toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' })}</span>
                                </div>
                                <h3 className="text-xl font-serif text-brand-charcoal mb-3 leading-snug group-hover:text-brand-brown transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-3 mb-4 leading-relaxed flex-grow">
                                    {post.excerpt}
                                </p>
                                <div className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/40 group-hover:text-brand-brown transition-colors mt-auto">
                                    Подробнее
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="mt-20 pt-8 border-t border-brand-brown/10">
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export const BlogListPage = memo(BlogListPageComponent);
