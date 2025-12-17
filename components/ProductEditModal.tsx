
import React, { useState, Fragment, useEffect, useRef } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { XMarkIcon, SparklesIcon, PhotoIcon, CubeIcon } from '@heroicons/react/24/outline';
import { Product } from '../types';
import { ModelUploader } from './admin/ModelUploader';
import { MediaUploader } from './admin/MediaUploader';
import { useAuth } from '../contexts/AuthContext';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (updatedProduct: Product) => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { user } = useAuth();
  const oldModelUrlRef = useRef<string | null>(null);
  const oldIosModelUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData(product);
      // Сохраняем начальные URL-ы моделей
      oldModelUrlRef.current = product.model3dUrl || null;
      oldIosModelUrlRef.current = product.model3dIosUrl || null;
    } else {
      setFormData({});
      oldModelUrlRef.current = null;
      oldIosModelUrlRef.current = null;
    }
  }, [product]);

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
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
    }
  };

  // Новая функция для удаления старых файлов
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
    if (product && formData) {
      // Проверяем, изменились ли ссылки на модели
      if (formData.model3dUrl !== oldModelUrlRef.current) {
        await deleteOldFile(oldModelUrlRef.current);
      }
      if (formData.model3dIosUrl !== oldIosModelUrlRef.current) {
        await deleteOldFile(oldIosModelUrlRef.current);
      }

      onSave({ ...product, ...formData } as Product);
      onClose();
    }
  };

  const handleAIAnalyze = async () => {
      // ... (existing code)
  };

  const handle3DUpload = (url: string) => {
      const isUsdz = url.toLowerCase().endsWith('.usdz');
      if (isUsdz) {
          // Запоминаем текущий URL перед его обновлением
          oldIosModelUrlRef.current = formData.model3dIosUrl || null;
          setFormData(prev => ({ ...prev, model3dIosUrl: url }));
      } else {
          oldModelUrlRef.current = formData.model3dUrl || null;
          setFormData(prev => ({ ...prev, model3d: url, model3dUrl: url }));
      }
  };

  const handleMediaUpload = (url: string, type: 'image' | 'video') => {
      // Логика удаления старых фото/видео может быть добавлена здесь по аналогии,
      // но для медиагалереи это обычно не требуется, т.к. их много.
      if (type === 'video') {
          setFormData(prev => ({ ...prev, videoUrl: url }));
      } else {
          setFormData(prev => ({
              ...prev,
              imageUrls: [...(prev.imageUrls || []), url]
          }));
      }
  };

  if (!product) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 font-serif">
                    Редактирование: {formData.name}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Tabs remain the same */}
                    <Tab.Group>
                        <Tab.List className="flex space-x-1 rounded-xl bg-brand-cream/30 p-1 mb-6">
                            {['Основное', 'Характеристики (AI)', '3D и Медиа', 'Изображения'].map((category) => (
                            <Tab key={category} className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all outline-none', selected ? 'bg-white shadow text-brand-brown' : 'text-gray-600 hover:bg-white/[0.12] hover:text-brand-brown')}>
                                {category}
                            </Tab>
                            ))}
                        </Tab.List>
                        <Tab.Panels>
                            {/* Panel 1: Main */}
                            <Tab.Panel className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₽)</label>
                                        <input type="number" name="price" value={formData.price || 0} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                                        <input type="text" name="category" value={formData.category || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1"><label className="block text-sm font-medium text-gray-700">Описание</label></div>
                                    <textarea name="description" rows={8} value={formData.description || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none text-sm leading-relaxed" />
                                </div>
                            </Tab.Panel>
                            {/* Panel 2: Specs */}
                            <Tab.Panel className="space-y-6">
                                {/* ... existing specs panel */}
                            </Tab.Panel>
                            {/* Panel 3: 3D */}
                            <Tab.Panel className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-800 flex items-center gap-2"><CubeIcon className="w-5 h-5" />Загрузка 3D</h4>
                                        <ModelUploader onUploadSuccess={handle3DUpload} />
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Android (.glb) URL</label>
                                            <input type="text" name="model3dUrl" value={formData.model3dUrl || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-xs" placeholder="https://..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">iOS (.usdz) URL</label>
                                            <input type="text" name="model3dIosUrl" value={formData.model3dIosUrl || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-xs" placeholder="https://..." />
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col items-center justify-center min-h-[300px]">
                                        {/* ... existing 3D preview */}
                                    </div>
                                </div>
                            </Tab.Panel>
                            {/* Panel 4: Images */}
                            <Tab.Panel>
                                {/* ... existing images panel */}
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-colors">Отмена</button>
                  <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-bold bg-brand-brown text-white hover:bg-brand-charcoal transition-all shadow-lg shadow-brand-brown/20">Сохранить изменения</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
