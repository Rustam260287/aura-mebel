import React, { useState, useEffect, useCallback, memo } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { XMarkIcon, SparklesIcon, ArrowPathIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';

interface ProductEditModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id'> | Product) => void;
}

const ProductEditModalComponent: React.FC<ProductEditModalProps> = ({ product, onClose, onSave }) => {
  const [productData, setProductData] = useState<Omit<Product, 'id'>>({
    name: '',
    category: '',
    price: 0,
    description: '',
    seoDescription: '',
    imageUrls: [],
    details: { dimensions: '', material: '', care: '' },
    rating: 0,
    reviews: [],
  });
  const [isSeoLoading, setIsSeoLoading] = useState(false);
  
  const { addToast } = useToast();

  useEffect(() => {
    if (product) {
      setProductData(product);
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProductData(prev => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [child]: value },
      }));
    } else {
      setProductData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleGenerateSeo = useCallback(async () => {
    setIsSeoLoading(true);
    try {
        // This functionality is not yet implemented in geminiService.ts
        // For now, we'll just show a toast.
        addToast('SEO generation is not yet implemented.', 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'An error occurred.', 'error');
    } finally {
      setIsSeoLoading(false);
    }
  }, [addToast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(product ? { ...product, ...productData } : productData);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-serif text-brand-brown">{product ? 'Редактировать товар' : 'Добавить товар'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}><XMarkIcon className="w-6 h-6" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Название</label>
            <input type="text" name="name" value={productData.name} onChange={handleChange} className="w-full p-2 border rounded" required />
          </div>
          
          {/* ... Other form fields ... */}

          <div className="flex items-end gap-4">
            <div className="flex-grow">
              <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700">SEO Описание</label>
              <textarea name="seoDescription" value={productData.seoDescription || ''} onChange={handleChange} className="w-full p-2 border rounded" rows={3}></textarea>
            </div>
            <Button variant="outline" type="button" onClick={handleGenerateSeo} disabled={isSeoLoading}>
                {isSeoLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
            </Button>
          </div>
          
          <div className="pt-4 border-t flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={onClose}>Отмена</Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProductEditModal = memo(ProductEditModalComponent);
