import React, { useState, useEffect, useCallback, memo } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { XMarkIcon, SparklesIcon, ArrowPathIcon, TrashIcon, PhotoIcon } from './Icons'; // Добавил иконки
import { useToast } from '../contexts/ToastContext';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

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
    videoUrl: '', // Добавлено поле
    details: { dimensions: '', material: '', care: '' },
    rating: 0,
    reviews: [],
  });
  const [isSeoLoading, setIsSeoLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { addToast } = useToast();

  useEffect(() => {
    if (product) {
      setProductData({
          ...product,
          details: product.details || { dimensions: '', material: '', care: '' }
      });
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
    if (!productData.name) {
        addToast('Введите название товара для генерации SEO.', 'error');
        return;
    }

    setIsSeoLoading(true);
    try {
        const response = await fetch('/api/products/generate-seo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: productData.name,
                category: productData.category,
                description: productData.description
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate SEO');
        }

        const data = await response.json();
        setProductData(prev => ({ ...prev, seoDescription: data.seoDescription }));
        addToast('SEO описание успешно сгенерировано!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Не удалось сгенерировать SEO описание.', 'error');
    } finally {
      setIsSeoLoading(false);
    }
  }, [productData.name, productData.category, productData.description, addToast]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    setIsUploading(true);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setProductData(prev => ({
        ...prev,
        imageUrls: [...(prev.imageUrls || []), downloadURL]
      }));
      addToast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error("Upload error:", error);
      addToast('Failed to upload image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Новый обработчик для видео
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    // Ограничение на размер видео (например, 50MB)
    if (file.size > 50 * 1024 * 1024) {
        addToast('Видео слишком большое (макс 50MB)', 'error');
        return;
    }

    const storageRef = ref(storage, `products/videos/${Date.now()}_${file.name}`);
    setIsUploading(true);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setProductData(prev => ({
        ...prev,
        videoUrl: downloadURL
      }));
      addToast('Видео успешно загружено', 'success');
    } catch (error) {
      console.error("Video upload error:", error);
      addToast('Не удалось загрузить видео', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setProductData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleRemoveVideo = () => {
      setProductData(prev => ({ ...prev, videoUrl: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
        ...productData,
        price: Number(productData.price)
    };
    onSave(product ? { ...product, ...dataToSave } : dataToSave);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-serif text-brand-brown">{product ? 'Редактировать товар' : 'Добавить товар'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}><XMarkIcon className="w-6 h-6" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Название</label>
                <input type="text" name="name" value={productData.name} onChange={handleChange} className="w-full p-2 border rounded" required />
            </div>
            <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Цена</label>
                <input type="number" name="price" value={productData.price} onChange={handleChange} className="w-full p-2 border rounded" required />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Категория</label>
            <select name="category" value={productData.category} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="">Выберите категорию</option>
                <option value="Диваны">Диваны</option>
                <option value="Кресла">Кресла</option>
                <option value="Кровати">Кровати</option>
                <option value="Столы">Столы</option>
                <option value="Стулья">Стулья</option>
                <option value="Шкафы">Шкафы</option>
                <option value="Кухни">Кухни</option>
                <option value="Мягкая мебель">Мягкая мебель</option>
                <option value="Гостиная">Гостиная</option>
                <option value="Спальни">Спальни</option>
            </select>
          </div>

          {/* Images */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Изображения</label>
              <div className="flex flex-wrap gap-4 mb-4">
                  {productData.imageUrls?.map((url, index) => (
                      <div key={index} className="relative group w-24 h-24">
                          <Image src={url} alt={`Product ${index}`} className="w-full h-full object-cover rounded border" width={96} height={96} />
                          <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <TrashIcon className="w-4 h-4" />
                          </button>
                      </div>
                  ))}
                  <label className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-brand-brown">
                      <span className="text-xs text-center text-gray-500">{isUploading ? '...' : '+ Фото'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
              </div>
          </div>

          {/* Video Upload Section */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Видео обзор</label>
              {productData.videoUrl ? (
                  <div className="relative w-full max-w-xs aspect-video bg-black rounded overflow-hidden border border-gray-300">
                      <video src={productData.videoUrl} controls className="w-full h-full" />
                      <button
                          type="button"
                          onClick={handleRemoveVideo}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md"
                          title="Удалить видео"
                      >
                          <TrashIcon className="w-4 h-4" />
                      </button>
                  </div>
              ) : (
                  <label className="flex items-center justify-center w-full max-w-xs p-4 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-brand-brown hover:bg-gray-50 transition-colors">
                      <div className="text-center">
                          <PhotoIcon className="w-8 h-8 mx-auto text-gray-400" /> {/* Используем PhotoIcon как заглушку, или VideoIcon если есть */}
                          <span className="mt-2 block text-sm font-medium text-gray-600">{isUploading ? 'Загрузка...' : 'Загрузить видео (MP4, WebM)'}</span>
                      </div>
                      <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={isUploading} />
                  </label>
              )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Описание</label>
            <textarea name="description" value={productData.description} onChange={handleChange} className="w-full p-2 border rounded" rows={4} required></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
                <label htmlFor="details.dimensions" className="block text-sm font-medium text-gray-700">Размеры</label>
                <input type="text" name="details.dimensions" value={productData.details?.dimensions || ''} onChange={handleChange} className="w-full p-2 border rounded" />
             </div>
             <div>
                <label htmlFor="details.material" className="block text-sm font-medium text-gray-700">Материал</label>
                <input type="text" name="details.material" value={productData.details?.material || ''} onChange={handleChange} className="w-full p-2 border rounded" />
             </div>
             <div>
                <label htmlFor="details.care" className="block text-sm font-medium text-gray-700">Уход</label>
                <input type="text" name="details.care" value={productData.details?.care || ''} onChange={handleChange} className="w-full p-2 border rounded" />
             </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-grow">
              <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700">SEO Описание</label>
              <textarea name="seoDescription" value={productData.seoDescription || ''} onChange={handleChange} className="w-full p-2 border rounded" rows={3}></textarea>
            </div>
            <Button variant="outline" type="button" onClick={handleGenerateSeo} disabled={isSeoLoading} title="Сгенерировать SEO описание с помощью ИИ">
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
