
import React, { useState, useEffect, useCallback } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { XMarkIcon, SparklesIcon, ArrowPathIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { generateSeoProductDescription } from '../services/geminiService';

interface ProductEditModalProps {
  product: Product;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState<Product>(product);
  const [isGenerating, setIsGenerating] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    setFormData(product);
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'originalPrice' ? Number(value) : value,
    }));
  };

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        details: {
            ...prev.details,
            [name]: value
        }
    }))
  };

  const handleGenerateSeo = useCallback(async () => {
    setIsGenerating(true);
    try {
        const newDescription = await generateSeoProductDescription(formData);
        setFormData(prev => ({ ...prev, seoDescription: newDescription }));
        addToast('SEO-описание сгенерировано!', 'success');
    } catch (error) {
        addToast('Ошибка генерации описания', 'error');
    } finally {
        setIsGenerating(false);
    }
  }, [formData, addToast]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    addToast('Товар успешно сохранен!', 'success');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-subtle-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-serif text-brand-brown">Редактировать товар</h2>
          <Button variant="ghost" onClick={onClose} className="p-2 -mr-2">
            <XMarkIcon className="w-6 h-6" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Название</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Цена (₽)</label>
                <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
              </div>
               <div>
                <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700">Старая цена (₽)</label>
                <input type="number" name="originalPrice" id="originalPrice" value={formData.originalPrice || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Категория</label>
                <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
              </div>
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Краткое описание</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown"></textarea>
          </div>

          <div>
            <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700 mb-1">SEO-описание</label>
            <div className="relative">
                 <textarea name="seoDescription" id="seoDescription" value={formData.seoDescription || ''} onChange={handleChange} rows={6} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown pr-32"></textarea>
                 <Button type="button" size="sm" variant="outline" className="absolute top-3 right-3" onClick={handleGenerateSeo} disabled={isGenerating}>
                    {isGenerating ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <SparklesIcon className="w-4 h-4"/>}
                    <span className="ml-2">Сгенерировать</span>
                 </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2 mb-3">Характеристики</h3>
             <div>
                <label htmlFor="material" className="block text-sm font-medium text-gray-700">Материал</label>
                <input type="text" name="material" id="material" value={formData.details.material} onChange={handleDetailsChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
          </div>


        </form>

        <footer className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
          <Button type="submit" onClick={handleSubmit}>Сохранить изменения</Button>
        </footer>
      </div>
    </div>
  );
};
