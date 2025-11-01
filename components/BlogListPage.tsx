import React, { useState } from 'react';
import type { BlogPost, Product, View } from '../types';
import { Button } from './Button';
import { SparklesIcon } from './Icons';
import { generateBlogPost } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { Skeleton } from './Skeleton';

interface BlogListPageProps {
  posts: BlogPost[];
  setPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
  allProducts: Product[];
  onNavigate: (view: View) => void;
}

const BlogPostCard: React.FC<{ post: BlogPost; onClick: () => void }> = ({ post, onClick }) => (
    <div 
        className="group bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        onClick={onClick}
    >
        <div className="relative overflow-hidden h-64">
            <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
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

const BlogCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <Skeleton className="h-64 w-full" />
        <div className="p-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <Skeleton className="h-6 w-1/3" />
        </div>
    </div>
);

export const BlogListPage: React.FC<BlogListPageProps> = ({ posts, setPosts, allProducts, onNavigate }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const handleGeneratePost = async () => {
        setIsLoading(true);
        try {
            const newPostData = await generateBlogPost(allProducts);
            const newPost: BlogPost = {
                ...newPostData,
                id: Date.now(),
                // Use picsum for a dynamic placeholder image based on the generated prompt
                imageUrl: `https://picsum.photos/seed/${encodeURIComponent(newPostData.imagePrompt)}/800/600`,
            };
            setPosts(prevPosts => [newPost, ...prevPosts]);
            addToast('Новая статья успешно сгенерирована!', 'success');
        } catch (error) {
            console.error(error);
            addToast(error instanceof Error ? error.message : 'Не удалось создать статью', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="text-center mb-8">
                <h1 className="text-5xl font-serif text-brand-brown mb-3">Наш Блог</h1>
                <p className="text-lg text-brand-charcoal max-w-2xl mx-auto">Идеи, советы и вдохновение для вашего идеального дома от нашего ИИ-дизайнера.</p>
            </div>

            <div className="flex justify-center mb-12">
                <Button size="lg" onClick={handleGeneratePost} disabled={isLoading}>
                    <SparklesIcon className={`w-6 h-6 mr-3 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Создаем статью...' : 'Сгенерировать новую статью'}
                </Button>
            </div>

            {posts.length === 0 && !isLoading && (
                 <div className="text-center py-16 text-brand-charcoal">
                    <p className="text-xl">В блоге пока нет статей.</p>
                    <p>Нажмите кнопку выше, чтобы наш ИИ написал первую!</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading && <BlogCardSkeleton />}
                {posts.map(post => (
                    <BlogPostCard 
                        key={post.id} 
                        post={post}
                        onClick={() => onNavigate({ page: 'blog-post', postId: post.id })}
                    />
                ))}
            </div>
        </div>
    );
};
