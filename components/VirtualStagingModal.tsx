import React, { useState, useCallback, DragEvent, memo } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { PhotoIcon, XMarkIcon, SparklesIcon } from './Icons';
import { generateConfiguredImage } from '../services/geminiService';
import { fileToBase64 } from '../utils';

interface VirtualStagingModalProps {
  product: Product;
  onClose: () => void;
}

export const VirtualStagingModal: React.FC<VirtualStagingModalProps> = memo(({ product, onClose }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setImageFile(null);
    setImagePreview(null);
    setGeneratedImage(null);
    setIsLoading(false);
    setError(null);
  }

  const handleFile = useCallback((file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      resetState();
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Пожалуйста, выберите файл изображения (JPEG, PNG, WEBP).');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] || null);
  };

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files?.[0] || null);
  };

  const handleSubmit = async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const base64Image = await fileToBase64(imageFile);
      const resultBase64 = await generateConfiguredImage(base64Image, imageFile.type, product.name, product.name);
      setGeneratedImage(`data:image/png;base64,${resultBase64}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-subtle-fade-in" onClick={onClose}>
      <div
        className="bg-brand-cream rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 border-b border-brand-cream-dark">
          <h2 className="text-2xl font-serif text-brand-brown flex items-center">
            <SparklesIcon className="w-6 h-6 mr-3"/>
            ИИ-стилист: примерка в интерьере
          </h2>
          <Button variant="ghost" onClick={onClose} className="p-2 -mr-2">
            <XMarkIcon className="w-6 h-6"/>
          </Button>
        </header>

        <div className="p-6 flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Upload & Controls */}
          <div className="flex flex-col gap-4">
            <p>Загрузите фото вашей комнаты, чтобы "примерить" <strong>{product.name}</strong>.</p>
            
            {!imagePreview && (
                <label
                    onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                    className={`flex justify-center w-full h-48 px-4 py-5 border-2 ${isDragOver ? 'border-brand-brown' : 'border-gray-300'} border-dashed rounded-md cursor-pointer transition-colors`}
                >
                    <div className="space-y-1 text-center self-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <span className="relative font-medium text-brand-brown hover:text-brand-brown-dark">Загрузите файл</span> или перетащите
                    </div>
                    <input type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
                </label>
            )}

            {imagePreview && (
              <div className="flex flex-col gap-4">
                <Button size="lg" className="w-full" onClick={handleSubmit} disabled={!imageFile || isLoading}>
                  {isLoading ? 'Создание...' : 'Сгенерировать'}
                </Button>
                <Button variant="outline" size="sm" onClick={resetState}>Загрузить другое фото</Button>
              </div>
            )}
            
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
          </div>

          {/* Right Column: Image Preview & Result */}
          <div className="flex flex-col gap-4">
            {isLoading && (
              <div className="w-full aspect-square bg-white/50 rounded-lg flex flex-col justify-center items-center text-center p-4">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-brown"></div>
                <p className="mt-4 font-semibold text-brand-charcoal">Наш ИИ-дизайнер расставляет мебель...</p>
                <p className="text-sm text-gray-600">Это может занять до 30 секунд.</p>
              </div>
            )}
            
            {!isLoading && (imagePreview || generatedImage) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {imagePreview && (
                    <div>
                        <h3 className="font-semibold text-center mb-2">Ваша комната</h3>
                        <img src={imagePreview} alt="Ваша комната" className="w-full rounded-lg shadow-md aspect-square object-cover" />
                    </div>
                  )}
                  {generatedImage && (
                    <div>
                        <h3 className="font-semibold text-center mb-2">Результат</h3>
                        <img src={generatedImage} alt="Сгенерированное изображение" className="w-full rounded-lg shadow-md aspect-square object-cover" />
                    </div>
                  )}
              </div>
            )}

            {!isLoading && !imagePreview && !generatedImage && (
                <div className="w-full aspect-square bg-gray-100 rounded-lg flex justify-center items-center">
                    <p className="text-gray-500">Здесь появится результат</p>
                </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
});