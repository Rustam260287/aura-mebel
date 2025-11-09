import React, { useState, useEffect, useCallback, memo } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { XMarkIcon, SparklesIcon, ArrowPathIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { generateSeoProductDescription } from '../services/geminiService';

interface ProductEditModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (productData: Product | Omit<Product, 'id'>) => Promise<void>;
}

const BLANK_PRODUCT_DATA: Omit<Product, 'id'> = {
  name: '',
  category: '',
  price: 0,
  originalPrice: 0,
  imageUrls: [],
  description: '',
  seoDescription: '',
  rating: 0,
  reviews: [],
  details: {
    dimensions: '',
    material: '',
    care: '',
  },
};


export const ProductEditModal: React.FC<ProductEditModalProps> = memo(({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState<Product | Omit<Product, 'id'>>(product || BLANK_PRODUCT_DATA);
  const [imageUrlsString, setImageUrlsString] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    setFormData(product || BLANK_PRODUCT_DATA);
    setImageUrlsString(product?.imageUrls.join(',\n') || '');
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumberField = ['price', 'originalPrice', 'rating'].includes(name);
    const processedValue = type === 'number' && isNumberField ? Number(value) : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
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
    }));
  };

  const handleGenerateSeo = useCallback(async () => {
    setIsGenerating(true);
    try {
        const productForGeneration = {
            ...formData,
            id: 'id' in formData ? formData.id : 'temp-id', 
        };
        const newDescription = await generateSeoProductDescription(productForGeneration as Product);
        setFormData(prev => ({ ...prev, seoDescription: newDescription }));
        addToast('SEO-описание сгенерировано!', 'success');
    } catch (error) {
        addToast('Ошибка генерации описания', 'error');
    } finally {
        setIsGenerating(false);
    }
  }, [formData, addToast]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
        ...formData,
        imageUrls: imageUrlsString.split(',').map(url => url.trim()).filter(Boolean),
    };
    await onSave(finalData);
    addToast(`Товар "${finalData.name}" успешно сохранен!`, 'success');
  };

  const isEditMode = product !== null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-subtle-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-serif text-brand-brown">{isEditMode ? 'Редактировать товар' : 'Добавить новый товар'}</h2>
          <Button variant="ghost" onClick={onClose} className="p-2 -mr-2">
            <XMarkIcon className="w-6 h-6" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Название</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Цена (₽)</label>
                <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
              </div>
               <div>
                <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700">Старая цена (₽)</label>
                <input type="number" name="originalPrice" id="originalPrice" value={formData.originalPrice || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Категория</label>
                <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
              </div>
          </div>
           <div>
            <label htmlFor="imageUrls" className="block text-sm font-medium text-gray-700">URL изображений (через запятую)</label>
            <textarea name="imageUrls" id="imageUrls" value={imageUrlsString} onChange={(e) => setImageUrlsString(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"></textarea>
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Краткое описание</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown"></textarea>
          </div>

          <div>
            <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700 mb-1">SEO-описание</label>
            <div className="relative">
                 <textarea name="seoDescription" id="seoDescription" value={formData.seoDescription || ''} onChange={handleChange} rows={5} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown pr-32"></textarea>
                 <Button type="button" size="sm" variant="outline" className="absolute top-3 right-3" onClick={handleGenerateSeo} disabled={isGenerating}>
                    {isGenerating ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <SparklesIcon className="w-4 h-4"/>}
                    <span className="ml-2">Сгенерировать</span>
                 </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2 mb-3">Характеристики</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label htmlFor="material" className="block text-sm font-medium text-