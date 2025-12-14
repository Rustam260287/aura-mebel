
import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { XMarkIcon, SparklesIcon, PhotoIcon, CubeIcon } from '@heroicons/react/24/outline';
import { Product } from '../types';
import { ModelUploader } from './admin/ModelUploader';
import { MediaUploader } from './admin/MediaUploader';
import { useAuth } from '../contexts/AuthContext'; // Import Auth

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
  const { user } = useAuth(); // Get user

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
        setFormData({});
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

  const handleSave = () => {
    if (product && formData) {
      onSave({ ...product, ...formData } as Product);
      onClose();
    }
  };

  const handleAIAnalyze = async () => {
      if (!formData.description) return;
      if (!user) {
          alert("Вы не авторизованы");
          return;
      }

      setIsAnalyzing(true);
      try {
          const token = await user.getIdToken();
          const response = await fetch('/api/admin/analyze-product', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` // Send Token
              },
              body: JSON.stringify({ description: formData.description })
          });
          
          if (!response.ok) throw new Error('AI request failed');

          const data = await response.json();
          
          if (data) {
              const newSpecs = { ...(formData.specs || {}) };
              if (data.width) newSpecs['Ширина'] = `${data.width} см`;
              if (data.depth) newSpecs['Глубина'] = `${data.depth} см`;
              if (data.height) newSpecs['Высота'] = `${data.height} см`;
              if (data.material) newSpecs['Материал'] = data.material;
              if (data.color) newSpecs['Цвет'] = data.color;
              
              setFormData(prev => ({ ...prev, specs: newSpecs }));
          }
      } catch (error) {
          console.error("AI Analysis failed", error);
          alert("Не удалось проанализировать описание.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handle3DUpload = (url: string) => {
      const isUsdz = url.toLowerCase().endsWith('.usdz');
      if (isUsdz) {
          setFormData(prev => ({ ...prev, model3dIosUrl: url }));
      } else {
          setFormData(prev => ({ ...prev, model3d: url, model3dUrl: url }));
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
                            <Tab.Panel className="space-y-6">
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-semibold text-purple-900">AI Ассистент</h4>
                                            <p className="text-xs text-purple-700">Автоматически извлечь характеристики из описания</p>
                                        </div>
                                        <button onClick={handleAIAnalyze} disabled={isAnalyzing} className="flex items-center gap-2 bg-white text-purple-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50">
                                            {isAnalyzing ? (<div className="animate-spin h-4 w-4 border-2 border-purple-700 border-t-transparent rounded-full"></div>) : (<SparklesIcon className="w-4 h-4" />)}
                                            {isAnalyzing ? 'Анализирую...' : 'AI Заполнить'}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {['Ширина', 'Глубина', 'Высота', 'Материал', 'Цвет'].map(spec => (
                                        <div key={spec}>
                                            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">{spec}</label>
                                            <input type="text" name={`specs.${spec}`} value={formData.specs?.[spec] || ''} onChange={handleChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-brand-brown/20 outline-none transition-colors" placeholder="Не указано" />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Прочие характеристики (JSON)</label>
                                    <textarea rows={4} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-600" value={JSON.stringify(formData.specs, null, 2)} readOnly />
                                </div>
                            </Tab.Panel>
                            <Tab.Panel className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-800 flex items-center gap-2"><CubeIcon className="w-5 h-5" />Загрузка 3D</h4>
                                        <ModelUploader onUploadSuccess={handle3DUpload} />
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Android (.glb) URL</label>
                                            <input type="text" name="model3d" value={formData.model3d || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-xs" placeholder="https://..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">iOS (.usdz) URL</label>
                                            <input type="text" name="model3dIosUrl" value={formData.model3dIosUrl || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-xs" placeholder="https://..." />
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col items-center justify-center min-h-[300px]">
                                        {formData.model3d ? (
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3"><CubeIcon className="w-8 h-8" /></div>
                                                <p className="font-medium text-gray-900">Модель подключена</p>
                                                <p className="text-xs text-gray-500 break-all mt-2 px-4">{formData.model3d}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-400"><CubeIcon className="w-16 h-16 mx-auto mb-2 opacity-20" /><p>Модель не загружена</p></div>
                                        )}
                                    </div>
                                </div>
                            </Tab.Panel>
                            <Tab.Panel>
                                <div className="grid grid-cols-3 gap-4">
                                    {formData.imageUrls?.map((url, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <button 
                                                    onClick={() => setFormData(prev => ({ ...prev, imageUrls: prev.imageUrls?.filter((_, i) => i !== index) }))}
                                                    className="bg-white/90 p-2 rounded-full text-red-500 hover:text-red-700"
                                                >
                                                    <XMarkIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <MediaUploader onUploadSuccess={handleMediaUpload}>
                                        {(open, isLoading) => (
                                            <button 
                                                onClick={open}
                                                disabled={isLoading}
                                                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand-brown hover:text-brand-brown transition-all bg-gray-50 hover:bg-brand-cream/10 disabled:opacity-50"
                                            >
                                                {isLoading ? (
                                                    <div className="animate-spin h-6 w-6 border-2 border-brand-brown border-t-transparent rounded-full" />
                                                ) : (
                                                    <>
                                                        <PhotoIcon className="w-8 h-8 mb-1" />
                                                        <span className="text-xs font-bold">Добавить</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </MediaUploader>
                                </div>
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
