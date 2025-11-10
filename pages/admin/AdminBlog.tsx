// pages/admin/AdminBlog.tsx
import React, { useState } from 'react';
import type { BlogPost } from '../../types';
import { Button } from '../../components/Button';
import { SparklesIcon, PencilSquareIcon, TrashIcon } from '../../components/Icons';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmationModal } from '../../components/ConfirmationModal';

interface AdminBlogProps {
  posts: BlogPost[];
  onEditPost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => Promise<void>;
  // Функция для обновления списка постов из родительского компонента
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
                // Также обновляем состояние на клиенте
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
                    {/* ... JSX таблицы без изменений ... */}
                </table>
            </div>
            <ConfirmationModal
                isOpen={!!postToDelete}
                onClose={() => setPostToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Подтвердите удаление"
                message={<>Вы уверены, что хотите удалить статью "<strong>{postToDelete?.title}</strong>"?</>}
                isLoading={isDeleting}
            />
        </div>
    );
};
