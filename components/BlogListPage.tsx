import React, { useState, memo } from 'react';
import type { BlogPost, View } from '../types';
import { Pagination } from './Pagination';
import Image from 'next/image';

interface BlogListPageProps {
  posts: BlogPost[];
  onNavigate: (view: View) => void;
}

const POSTS_PER_PAGE = 9;

const BlogPostCard: React.FC<{ post: BlogPost; onClick: () => void }> = ({ post, onClick }) => (
    <div 
        className="group bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        onClick={onClick}
    >
        <div className="relative overflow-hidden h-64">
            <Image 
                src={post.imageUrl || '/placeholder.svg'} 
                alt={post.title} 
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                fill
            />
        </div>
        <div className="p-6">
            <h3 className="text-2xl font-serif text-brand-brown mb-3">{post.title}</h3>
            <p className="text-brand-charcoal/80 leading-relaxed line-clamp-3">{post.excerpt}</p>
            <div className="mt-4 text-brand-terracotta font-semibold hover:text-brand-terracotta-dark">
                Читать далее &rarr;
            </div>
        </div>
    </div>
);

const BlogListPageComponent: React.FC<BlogListPageProps> = ({ posts, onNavigate }) => {
    const [currentPage, setCurrentPage] = useState(1);
    
    const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

    const currentPosts = posts.slice(
        (currentPage - 1) * POSTS_PER_PAGE,
        currentPage * POSTS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-serif text-brand-brown mb-3">Наш Блог</h1>
                <p className="text-lg text-brand-charcoal max-w-2xl mx-auto">Идеи, советы и вдохновение для вашего идеального дома от нашего ИИ-дизайнера.</p>
            </div>

            {posts.length === 0 ? (
                 <div className="text-center py-16 text-brand-charcoal">
                    <p className="text-xl">В блоге пока нет статей.</p>
                    <p>Загляните позже, чтобы увидеть новые публикации!</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {currentPosts.map(post => (
                            <BlogPostCard 
                                key={post.id} 
                                post={post}
                                onClick={() => onNavigate({ page: 'blog-post', postId: post.id })}
                            />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="mt-16">
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export const BlogListPage = memo(BlogListPageComponent);
