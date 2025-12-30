
import React, { useState, memo } from 'react';
import type { JournalEntry, View } from '../types';
import { Pagination } from './Pagination';
import Image from 'next/image';

interface JournalListPageProps {
  entries: JournalEntry[];
  onNavigate: (view: View) => void;
}

const POSTS_PER_PAGE = 9;

const JournalListPageComponent: React.FC<JournalListPageProps> = ({ entries, onNavigate }) => {
    const [currentPage, setCurrentPage] = useState(1);
    
    // Сортировка: новые первыми (уже сделана на сервере, но на всякий случай)
    // Выделяем первый пост как "Главную тему номера"
    const heroPost = entries[0];
    const otherPosts = entries.slice(1);

    const totalPages = Math.ceil(otherPosts.length / POSTS_PER_PAGE);
    
    const currentPosts = otherPosts.slice(
        (currentPage - 1) * POSTS_PER_PAGE,
        currentPage * POSTS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (entries.length === 0) {
        return (
             <div className="container mx-auto px-6 py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
                <h2 className="text-3xl font-serif text-brand-charcoal mb-4">Журнал Labelcom</h2>
                <p className="text-gray-500">Статьи готовятся к публикации. Загляните позже.</p>
            </div>
        )
    }

    return (
        <div className="bg-brand-cream min-h-screen">
            {/* Header Section */}
            <div className="relative py-20 md:py-28 text-center border-b border-brand-brown/5 bg-white">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-brand-terracotta/5 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 container mx-auto px-6">
                    <span className="text-brand-terracotta font-bold tracking-[0.3em] text-xs uppercase mb-6 block animate-fade-in-up">Est. 2024</span>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-brand-charcoal mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>Labelcom <span className="italic font-light">Journal</span></h1>
                    <p className="text-lg md:text-xl text-brand-charcoal/60 font-light italic max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        "Искусство жить красиво. Тренды, дизайн и философия уюта."
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-16 md:py-24">
                {/* Hero Post */}
                {heroPost && currentPage === 1 && (
                    <div 
                        className="group mb-20 md:mb-32 cursor-pointer grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center"
                        onClick={() => onNavigate({ page: 'journal-entry', entryId: heroPost.id })}
                    >
                        <div className="relative aspect-[4/3] lg:aspect-[16/10] w-full overflow-hidden rounded-sm shadow-xl shadow-brand-brown/5 order-2 lg:order-1">
                            <Image 
                                src={heroPost.imageUrl || '/placeholder.svg'} 
                                alt={heroPost.title} 
                                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                                fill
                                priority
                            />
                            <div className="absolute inset-0 bg-brand-charcoal/10 group-hover:bg-transparent transition-colors duration-500" />
                        </div>
                        
                        <div className="lg:pl-8 text-center lg:text-left order-1 lg:order-2">
                            <div className="flex items-center justify-center lg:justify-start gap-4 mb-6 text-[10px] font-bold tracking-[0.2em] text-brand-terracotta uppercase">
                                <span>Главная тема</span>
                                <div className="w-8 h-px bg-brand-terracotta"></div>
                                <span>{(heroPost.tags && heroPost.tags[0]) || 'Тренды'}</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif text-brand-charcoal mb-6 leading-[1.1] group-hover:text-brand-terracotta transition-colors duration-300">
                                {heroPost.title}
                            </h2>
                            <p className="text-lg text-brand-charcoal/70 mb-8 font-light leading-relaxed line-clamp-3">
                                {heroPost.excerpt}
                            </p>
                            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-brand-charcoal group-hover:text-brand-terracotta transition-colors pb-1 border-b border-brand-charcoal/20 group-hover:border-brand-terracotta">
                                Читать статью
                                <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </span>
                        </div>
                    </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                    {currentPosts.map((post, idx) => (
                        <div 
                            key={post.id} 
                            className="group cursor-pointer flex flex-col h-full animate-fade-in-up"
                            style={{ animationDelay: `${idx * 100}ms` }}
                            onClick={() => onNavigate({ page: 'journal-entry', entryId: post.id })}
                        >
                            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-sm mb-6 bg-gray-100 shadow-sm group-hover:shadow-lg transition-shadow duration-500">
                                <Image 
                                    src={post.imageUrl || '/placeholder.svg'} 
                                    alt={post.title} 
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                <div className="absolute inset-0 bg-brand-charcoal/5 group-hover:bg-transparent transition-colors duration-300"></div>
                            </div>
                            <div className="flex flex-col flex-grow">
                                <div className="flex items-center gap-3 mb-3 text-[10px] font-bold tracking-widest text-brand-charcoal/40 uppercase">
                                    <span className="text-brand-terracotta">{(post.tags && post.tags[0]) || 'Дизайн'}</span>
                                    <span className="w-1 h-1 rounded-full bg-brand-charcoal/20"></span>
                                    <span>{new Date(post.createdAt || Date.now()).toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' })}</span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-serif text-brand-charcoal mb-3 leading-tight group-hover:text-brand-terracotta transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-sm text-brand-charcoal/60 line-clamp-3 mb-6 leading-relaxed flex-grow font-light">
                                    {post.excerpt}
                                </p>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/40 group-hover:text-brand-terracotta transition-colors mt-auto flex items-center gap-1">
                                    Подробнее
                                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="mt-24 pt-12 border-t border-brand-brown/5">
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

export const JournalListPage = memo(JournalListPageComponent);
