
import React, { useState, useEffect, memo } from 'react';
import type { BlogPost } from '../types';
import { Button } from './Button';
import { XMarkIcon, TrashIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

interface BlogEditModalProps {
  post: BlogPost;
  onClose: () => void;
  onSave: (postData: BlogPost) => Promise<void>;
}

export const BlogEditModal: React.FC<BlogEditModalProps> = memo(({ post, onClose, onSave }) => {
  const [formData, setFormData] = useState<BlogPost>(post);
  const [relatedProductsString, setRelatedProductsString] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    setFormData(post);
    // Безопасное обращение к relatedProducts для старых постов
    setRelatedProductsString((post.relatedProducts || []).join(', '));
  }, [post]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const storageRef = ref(storage, `blog/${Date.now()}_${file.name}`);
    setIsUploading(true);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setFormData(prev => ({
        ...prev,
        imageUrl: downloadURL
      }));
      addToast('Изображение успешно загружено', 'success');
    } catch (error) {
      console.error("Upload error:", error);
      addToast('Ошибка загрузки изображения', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
      setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      relatedProducts: relatedProductsString.split(',').map(id => id.trim()).filter(Boolean),
    };
    await onSave(finalData);
    addToast(`Статья "${finalData.title}" успешно сохранена!`, 'success');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-subtle-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-serif text-brand-brown">Редактировать статью</h2>
          <Button variant="ghost" onClick={onClose} className="p-2 -mr-2">
            <XMarkIcon className="w-6 h-6" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Заголовок</label>
                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown p-2 border" />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Статус</label>
                <select
                    name="status"
                    id="status"
                    value={formData.status || 'published'} // Старые посты считаем опубликованными по умолчанию в UI
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown p-2 border"
                >
                    <option value="draft">Черновик</option>
                    <option value="published">Опубликовано</option>
                </select>
              </div>
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">Анонс</label>
            <textarea name="excerpt" id="excerpt" value={formData.excerpt} onChange={handleChange} rows={3} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown p-2 border"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Изображение обложки</label>
            {formData.imageUrl ? (
                <div className="relative group w-full max-w-md aspect-video bg-gray-100 rounded overflow-hidden">
                    <Image src={formData.imageUrl} alt="Post Cover" fill className="object-cover" />
                     <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                 <label className="w-full max-w-md h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-brand-brown bg-gray-50 hover:bg-gray-100 transition-colors">
                    <span className="text-sm text-gray-600">{isUploading ? 'Загрузка...' : 'Нажмите для загрузки изображения'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                </label>
            )}
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">Содержание (HTML)</label>
            <textarea name="content" id="content" value={formData.content} onChange={handleChange} rows={12} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown p-2 border font-mono text-sm"></textarea>
          </div>
          
          <div>
            <label htmlFor="relatedProducts" className="block text-sm font-medium text-gray-700">ID связанных товаров (через запятую)</label>
            <input type="text" name="relatedProducts" id="relatedProducts" value={relatedProductsString} onChange={(e) => setRelatedProductsString(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown p-2 border" />
          </div>
          
          <div>
            <label htmlFor="imagePrompt" className="block text-sm font-medium text-gray-700">Промпт для изображения (на английском)</label>
            <input type="text" name="imagePrompt" id="imagePrompt" value={formData.imagePrompt || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown p-2 border" />
          </div>

        </form>

        <footer className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
          <Button type="submit" onClick={handleSubmit}>Сохранить</Button>
        </footer>
      </div>
    </div>
  );
});

BlogEditModal.displayName = 'BlogEditModal';
