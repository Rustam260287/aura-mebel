import React, { useState, useCallback, DragEvent, memo } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { PhotoIcon, XMarkIcon } from './Icons';
import { getVisualRecommendations } from '../services/geminiService';
import { fileToBase64 } from '../utils';
import { ProductCard } from './ProductCard';

interface VisualSearchPageProps {
  allProducts: Product[];
  onProductSelect: (productId: string) => void;
}

export const VisualSearchPage: React.FC<VisualSearchPageProps> = memo(({ allProducts, onProductSelect }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  const handleFile = useCallback((file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
      setRecommendedProducts([]);
    } else {
      setError('Пожалуйста, выберите файл изображения (JPEG, PNG, WEBP).');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] || null);
  };
  
  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files?.[0] || null);
  };

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setRecommendedProducts([]);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setError(null);
    setRecommendedProducts([]);

    try {
      const base64Image = await fileToBase64(imageFile);
      const recommendedNames = await getVisualRecommendations(base64Image, imageFile.type, allProducts);
      
      if (recommendedNames.length === 0) {
        setError('К сожалению, мы не смогли найти подходящую мебель. Попробуйте другое фото.');
      } else {
        const foundProducts = allProducts.filter(p => recommendedNames.includes(p.name));
        setRecommendedProducts(foundProducts);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, allProducts]);

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-serif text-brand-brown mb-4">Визуальный поиск</h1>
        <p className="text-lg text-brand-charcoal mb-8 leading-relaxed">Загрузите фото интерьера, и наш ИИ-стилист подберет похожую мебель из нашего каталога.</p>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        {!imagePreview ? (
          <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex justify-center w-full h-64 px-6 pt-5 pb-6 border-2 ${isDragOver ? 'border-brand-brown' : 'border-gray-300'} border-dashed rounded-md cursor-pointer transition-colors`}
          >
            <div className="space-y-1 text-center self-center">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                    <span className="relative font-medium text-brand-brown hover:text-brand-brown-dark">
                        <span>Загрузите файл</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                    </span>
                    <p className="pl-1">или перетащите его сюда</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP до 10MB</p>
            </div>
          </label>
        ) : (
          <div className="relative">
            <img src={imagePreview} alt="Предпросмотр" className="w-full h-auto max-h-96 object-contain rounded-md" />
            <Button
                variant="ghost"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm p-2 rounded-full !w-auto !h-auto"
                aria-label="Удалить изображение"
            >
                <XMarkIcon className="w-6 h-6"/>
            </Button>
          </div>
        )}

        <div className="mt-6">
            <Button size="lg" className="w-full" onClick={handleSubmit} disabled={!imageFile || isLoading}>
              {isLoading ? 'Анализируем...' : 'Найти мебель'}
            </Button>
        </div>

        {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-center">{error}</div>}
      </div>

      {recommendedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-3xl font-serif text-brand-charcoal mb-8 text-center">Мы нашли для вас:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {recommendedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onProductSelect={onProductSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});