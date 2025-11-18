// pages/admin/AdminBlog.tsx
import React, { useState } from 'react';
import type { BlogPost } from '../../types';
import { Button } from '../../components/Button';
import { PencilSquareIcon, TrashIcon, SparklesIcon } from '../../components/Icons';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmationModal } from '../../components/ConfirmationModal';

interface AdminBlogProps {
  posts: BlogPost[];
  onEditPost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => Promise<void>;
  setBlogPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
}

export const AdminBlog: React.FC<AdminBlogProps> = ({ posts, onEditPost, onDeletePost, setBlogPosts }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
    const { addToast } = useToast();

    const handleGeneratePost = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/blog/generate', {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка сервера');
            }

            const { post: newPost } = await response.json();
            setBlogPosts(prevPosts => [newPost, ...prevPosts].sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime()));
            addToast('Новая статья успешно сгенерирована и сохранена!', 'success');
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Не удалось создать статью', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (postToDelete) {
            setIsDeleting(true);
            try {
                await onDeletePost(postToDelete.id);
                setBlogPosts(prev => prev.filter(p => p.id !== postToDelete.id));
                addToast(`Статья "${postToDelete.title}" была удалена.`, 'success');
            } catch (error) {
                addToast(`Не удалось удалить статью.`, 'error');
                console.error(error);
            } finally {
                setPostToDelete(null);
                setIsDeleting(false);
            }
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
            <div className="bg-white rounded-lg shadow-lg">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Заголовок</th>
                            <th scope="col" className="px-6 py-3">Дата</th>
                            <th scope="col" className="px-6 py-3">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map((post) => (
                            <tr key={post.id} className="bg-white border-b hover:bg-gray-50">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                    {post.title}
                                </th>
                                <td className="px-6 py-4">{new Date(post.id).toLocaleDateString()}</td>
                                <td className="px-6 py-4 flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => onEditPost(post)}>
                                        <PencilSquareIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setPostToDelete(post)}>
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ConfirmationModal
                isOpen={!!postToDelete}
                onClose={() => setPostToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Подтвердите удаление"
                message={<>Вы уверены, что хотите удалить статью &quot;<strong>{postToDelete?.title}</strong>&quot;?</>}
                isLoading={isDeleting}
            />
        </div>
    );
};
