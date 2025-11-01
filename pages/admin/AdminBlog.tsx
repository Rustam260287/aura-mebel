

import React, { useState } from 'react';
import type { BlogPost, Product } from '../../types';
import { Button } from '../../components/Button';
import { SparklesIcon, PencilSquareIcon, TrashIcon } from '../../components/Icons';
import { generateBlogPost } from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmationModal } from '../../components/ConfirmationModal';

interface AdminBlogProps {
  posts: BlogPost[];
  setPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
  allProducts: Product[];
}

export const AdminBlog: React.FC<AdminBlogProps> = ({ posts, setPosts, allProducts }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
    const { addToast } = useToast();

    const handleGeneratePost = async () => {
        setIsLoading(true);
        try {
            const newPostData = await generateBlogPost(allProducts);
            const newPost: BlogPost = {
                ...newPostData,
                id: Date.now(),
                imageUrl: `https://picsum.photos/seed/${encodeURIComponent(newPostData.imagePrompt)}/800/600`,
            };
            setPosts(prevPosts => [newPost, ...prevPosts]);
            addToast('Новая статья успешно сгенерирована!', 'success');
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Не удалось создать статью', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmDelete = () => {
      if (postToDelete) {
        setIsDeleting(true);
        // Simulate API call
        setTimeout(() => {
          setPosts(prevPosts => prevPosts.filter(p => p.id !== postToDelete.id));
          addToast(`Статья "${postToDelete.title}" была удалена.`, 'success');
          setPostToDelete(null);
          setIsDeleting(false);
        }, 500);
      }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif text-brand-brown">Управление блогом</h1>
                <Button onClick={handleGeneratePost} disabled={isLoading}>
                    <SparklesIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Генерация...' : 'Создать статью с ИИ'}
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Заголовок</th>
                                <th scope="col" className="px-6 py-3">Анонс</th>
                                <th scope="col" className="px-6 py-3 text-center">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map(post => (
                                <tr key={post.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 w-1/3">
                                        {post.title}
                                    </td>
                                    <td className="px-6 py-4 w-1/2 line-clamp-2">
                                        {post.excerpt}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="outline" size="sm" disabled>
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setPostToDelete(post)}>
                                                <TrashIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ConfirmationModal
                isOpen={!!postToDelete}
                onClose={() => setPostToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Подтвердите удаление"
                message={
                    <>
                        Вы уверены, что хотите удалить статью "<strong>{postToDelete?.title}</strong>"? Это действие необратимо.
                    </>
                }
                isLoading={isDeleting}
            />
        </div>
    );
};