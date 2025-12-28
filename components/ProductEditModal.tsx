
import React, { useState, Fragment, useEffect, useRef } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { XMarkIcon, SparklesIcon, PhotoIcon, CubeIcon, PlusIcon } from './icons';
import { Product } from '../types';
import { ModelUploader } from './admin/ModelUploader';
import { MediaUploader } from './admin/MediaUploader';
import { useAuth } from '../contexts/AuthContext';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (updatedProduct: Product | Omit<Product, 'id'>) => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { user } = useAuth();
  const oldGlbModelUrlRef = useRef<string | null>(null);
  const oldUsdzModelUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData(product);
      oldGlbModelUrlRef.current = product.models?.glb || null;
      oldUsdzModelUrlRef.current = product.models?.usdz || null;
    } else {
      setFormData({
        name: '',
        category: '',
        description: '',
        imageUrls: [],
        specs: {},
        models: {},
      });
      oldGlbModelUrlRef.current = null;
      oldUsdzModelUrlRef.current = null;
    }
  }, [product, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('specs.')) {
        const specKey = name.split('.')[1];
        setFormData(prev => ({
            ...prev,
            specs: {
                ...prev.specs,
                [specKey]: value
            }
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const deleteOldFile = async (fileUrl: string | null) => {
    if (!fileUrl) return;
    try {
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      await fetch('/api/admin/delete-storage-object', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fileUrl }),
      });
    } catch (error) {
      console.error("Failed to delete old file:", error);
    }
  };

  const handleSave = async () => {
      // For editing existing product
      if (product && formData.id) {
        if (formData.models?.glb !== oldGlbModelUrlRef.current) {
          await deleteOldFile(oldGlbModelUrlRef.current);
        }
        if (formData.models?.usdz !== oldUsdzModelUrlRef.current) {
          await deleteOldFile(oldUsdzModelUrlRef.current);
        }
        onSave({ ...product, ...formData } as Product);
      } else { // For adding new product
        onSave(formData as Omit<Product, 'id'>);
      }
      onClose();
  };

  const handleAIAnalyze = async () => {
      // ... existing code
  };

  const handle3DUpload = (url: string, uploadedExt?: 'glb' | 'usdz') => {
      if (uploadedExt === 'usdz') {
          oldUsdzModelUrlRef.current = formData.models?.usdz || null;
          setFormData(prev => ({ ...prev, models: { ...prev.models, usdz: url } }));
      } else {
          oldGlbModelUrlRef.current = formData.models?.glb || null;
          setFormData(prev => ({ ...prev, models: { ...prev.models, glb: url } }));
      }
  };

  const handleMediaUpload = (url: string, type: 'image' | 'video') => {
      if (type === 'video') {
          setFormData(prev => ({ ...prev, videoUrl: url }));
      } else {
          setFormData(prev => ({
              ...prev,
              imageUrls: [...(prev.imageUrls || []), url]
          }));
      }
  };
  
  const handleRemoveImage = (index: number) => {
    // We don't delete from storage here, assuming it's handled on save if needed.
    // This just removes from the list to be saved.
    setFormData(prev => ({
        ...prev,
        imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 font-serif">
                    {product ? `Редактирование: ${formData.name}` : 'Добавление нового товара'}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <Tab.Group>
                        <Tab.List className="flex space-x-1 rounded-xl bg-brand-cream/30 p-1 mb-6">
                            {['Основное', 'Характеристики (AI)', '3D и Медиа', 'Изображения'].map((category) => (
                            <Tab key={category} className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all outline-none', selected ? 'bg-white shadow text-brand-brown' : 'text-gray-600 hover:bg-white/[0.12] hover:text-brand-brown')}>
                                {category}
                            </Tab>
                            ))}
                        </Tab.List>
                        <Tab.Panels>
                            <Tab.Panel className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1\">Название</label>
                                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1\">Цена (₽)</label>
                                        <input type="number" name="price" value={formData.price || 0} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1\">Категория</label>
                                        <input type="text" name="category" value={formData.category || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1\"><label className="block text-sm font-medium text-gray-700\">Описание</label></div>
                                    <textarea name=\"description\" rows={8} value={formData.description || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none text-sm leading-relaxed\" />
                                </div>
                            </Tab.Panel>
                            <Tab.Panel className=\"space-y-6\">
                                {/* ... existing specs panel */}
                            </Tab.Panel>
                            <Tab.Panel className=\"space-y-6\">
                                <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
                                    <div className=\"space-y-4\">\n                                        <h4 className=\"font-semibold text-gray-800 flex items-center gap-2\"><CubeIcon className=\"w-5 h-5\" />Загрузка 3D</h4>\n                                        <ModelUploader onUploadSuccess={handle3DUpload} />\n                                        <div className=\"mt-4\">\n                                            <label className=\"block text-sm font-medium text-gray-700 mb-1\">3D модель (GLB - Android/Web)</label>\n                                            <input type=\"text\" name=\"models.glb\" value={formData.models?.glb || ''} onChange={handleChange} className=\"w-full p-2 border border-gray-300 rounded-lg text-xs\" placeholder=\"https://...\" />\n                                            <p className=\"text-xs text-gray-500 mt-1\">GLB используется для Android и WebAR.</p>\n                                        </div>\n                                        <div>\n                                            <label className=\"block text-sm font-medium text-gray-700 mb-1\">3D модель (USDZ - iPhone)</label>\n                                            <input type=\"text\" name=\"models.usdz\" value={formData.models?.usdz || ''} onChange={handleChange} className=\"w-full p-2 border border-gray-300 rounded-lg text-xs\" placeholder=\"https://...\" />\n                                            <p className=\"text-xs text-gray-500 mt-1\">USDZ используется только для iOS (AR Quick Look).</p>\n                                        </div>\n                                    </div>\n                                    <div className=\"bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col items-center justify-center min-h-[300px]\">\n                                        {/* ... existing 3D preview */}\n                                    </div>\n                                </div>\n                            </Tab.Panel>\n                            <Tab.Panel>\n                                <h4 className=\"font-semibold text-gray-800 flex items-center gap-2 mb-4\"><PhotoIcon className=\"w-5 h-5\" />Галерея изображений</h4>\n                                <div className=\"grid grid-cols-4 gap-4\">\n                                    {(formData.imageUrls || []).map((url, index) => (\n                                        <div key={index} className=\"relative group aspect-square\">\n                                            <img src={url} alt={`Image ${index + 1}`} className=\"w-full h-full object-cover rounded-lg\" />\n                                            <button onClick={() => handleRemoveImage(index)} className=\"absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity\">\n                                                <XMarkIcon className=\"w-4 h-4\" />\n                                            </button>\n                                        </div>\n                                    ))}\n                                    <MediaUploader onUploadSuccess={handleMediaUpload}>\n                                        {(open, isLoading) => (\n                                            <button onClick={open} disabled={isLoading} className=\"border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 aspect-square\">\n                                                {isLoading ? '...' : <PlusIcon className=\"w-8 h-8 text-gray-400\" />}\n                                            </button>\n                                        )}\n                                    </MediaUploader>\n                                </div>\n                            </Tab.Panel>\n                        </Tab.Panels>\n                    </Tab.Group>\n                </div>\n                <div className=\"p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3\">\n                  <button onClick={onClose} className=\"px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-colors\">Отмена</button>\n                  <button onClick={handleSave} className=\"px-6 py-2.5 rounded-xl font-bold bg-brand-brown text-white hover:bg-brand-charcoal transition-all shadow-lg shadow-brand-brown/20\">Сохранить</button>\n                </div>\n              </Dialog.Panel>\n            </Transition.Child>\n          </div>\n        </div>\n      </Dialog>\n    </Transition>\n  );\n};
