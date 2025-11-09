import React, { useState, useEffect, memo } from 'react';
import type { BlogPost } from '../types';
import { Button } from './Button';
import { XMarkIcon, SparklesIcon, ArrowPathIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { generateSeoBlogContent } from '../services/geminiService';

interface BlogEditModalProps {
  post: BlogPost;
  onClose: () => void;
  onSave: (postData: BlogPost) => Promise<void>;
}

export const BlogEditModal: React.FC<BlogEditModalProps> = memo(({ post, onClose, onSave }) => {
  const [formData, setFormData] = useState<BlogPost>(post);
  const [relatedProductsString, setRelatedProductsString] = useState('');
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    setFormData(post);
    setRelatedProductsString(post.relatedProducts.join(', '));
  }, [post]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateSeo = async () => {
    setIsGeneratingSeo(true);
    try {
        const seoResult = await generateSeoBlogContent(formData);
        setFormData(prev => ({
            ...prev,
            title: seoResult.title,
            excerpt: seoResult.excerpt,
        }));
        addToast('Заголовок и анонс оптимизированы!', 'success');
    } catch (error) {
        addToast('Ошибка SEO-оптимизации', 'error');
        console.error("SEO generation failed:", error);
    } finally {
        setIsGeneratingSeo(false);
    }
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
          <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Заголовок</label>
                <Button type="button" size="sm" variant="ghost" className="text-sm text-brand-terracotta hover:text-brand-terracotta-dark" onClick={handleGenerateSeo} disabled={isGeneratingSeo}>
                    {isGeneratingSeo ? <ArrowPathIcon className="w-4 h-4 animate-spin mr-2"/> : <SparklesIcon className="w-4 h-4 mr-2"/>}
                    <span>Оптимизировать с ИИ</span>
                </Button>
            </div>
            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">Анонс</label>
            <textarea name="excerpt" id="excerpt" value={formData.excerpt} onChange={handleChange} rows={3} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown"></textarea>
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">Содержание (HTML)</label>
            <textarea name="content" id="content" value={formData.content} onChange={handleChange} rows={8} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown"></textarea>
          </div>
          
          <div>
            <label htmlFor="relatedProducts" className="block text-sm font-medium text-gray-700">ID связанных товаров (через запятую)</label>
            <input type="text" name="relatedProducts" id="relatedProducts" value={relatedProductsString} onChange={(e) => setRelatedProductsString(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
          </div>
          
          <div>
            <label htmlFor="imagePrompt" className="block text-sm font-medium text-gray-700">Промпт для изображения (на английском)</label>
            <input type="text" name="imagePrompt" id="imagePrompt" value={formData.imagePrompt} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
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
