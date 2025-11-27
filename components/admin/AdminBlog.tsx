
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
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
    const [topic, setTopic] = useState('');
    const { addToast } = useToast();

    const handleGeneratePost = async () => {
        if (!topic.trim()) {
            addToast('Пожалуйста, введите тему для статьи.', 'error');
            return;
        }
        setIsLoading(true);
        setIsGenerating(false); // Сразу закрываем модал
        try {
            console.log('Отправка запроса на /api/blog/generate с темой:', topic);
            const response = await fetch('/api/blog/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });

            console.log('Получен ответ от сервера, статус:', response.status);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ошибка сервера');
            }

            const { post: newPost } = data;
            setBlogPosts(prevPosts => [newPost, ...prevPosts].sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime()));
            addToast('Новая статья успешно сгенерирована!', 'success');
            setTopic(''); // Очищаем тему после успеха

        } catch (error) {
            console.error('Ошибка при генерации или обработке поста:', error);
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
                <Button onClick={() => setIsGenerating(true)} disabled={isLoading}>
                    <SparklesIcon className={`w-5 h-5 mr-2 ${isLoading && isGenerating ? 'animate-spin' : ''}`} />
                    {isLoading && isGenerating ? 'Генерация...' : 'Создать статью с ИИ'}
                </Button>
            </div>

            {/* ... таблица остается прежней ... */}
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

            {/* Модал для ввода темы */}
            <ConfirmationModal
                isOpen={isGenerating}
                onClose={() => setIsGenerating(false)}
                onConfirm={handleGeneratePost}
                title="Создать статью с помощью ИИ"
                confirmText="Сгенерировать"
                confirmButtonVariant="primary" // Используем основной цвет кнопки
                isLoading={isLoading}
            >
                <div className="mt-4">
                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                        Тема статьи:
                    </label>
                    <input
                        type="text"
                        id="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="например, 'Как выбрать диван для гостиной'"
                        className="w-full p-2 border rounded-md"
                    />
                </div>
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={!!postToDelete}
                onClose={() => setPostToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Подтвердите удаление"
                message={<>Вы уверены, что хотите удалить статью &quot;<strong>{postToDelete?.title}</strong>&quot;?</>}
                isLoading={isDeleting}
                confirmButtonVariant="danger" // Для удаления оставляем красный
            />
        </div>
    );
};
