import React, { useState } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { XMarkIcon, SparklesIcon } from './Icons';
import { changeProductUpholstery } from '../services/geminiService';
import { imageUrlToBase64 } from '../utils';
import { Skeleton } from './Skeleton';

interface UpholsteryChangerModalProps {
  product: Product;
  onClose: () => void;
}

export const UpholsteryChangerModal: React.FC<UpholsteryChangerModalProps> = ({ product, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
        setError("Пожалуйста, опишите желаемую обивку.");
        return;
    };

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const { base64, mimeType } = await imageUrlToBase64(product.imageUrls[0]);
      const resultBase64 = await changeProductUpholstery(base64, mimeType, prompt);
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
            ИИ-стилист обивки
          </h2>
          <Button variant="ghost" onClick={onClose} className="p-2 -mr-2">
            <XMarkIcon className="w-6 h-6"/>
          </Button>
        </header>

        <div className="p-6 flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Controls & Original Image */}
          <div className="flex flex-col gap-4">
            <p>Опишите материал или цвет, который вы хотите видеть. Например: "темно-зеленый велюр" или "кожа в стиле винтаж".</p>
            
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Например, синий бархат..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-brown h-24 resize-none"
                disabled={isLoading}
            />
            <Button size="lg" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Создаем...' : 'Применить стиль'}
            </Button>
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
            
            <div className="mt-4">
                <h3 className="font-semibold text-center mb-2">Оригинал</h3>
                <img src={product.imageUrls[0]} alt={product.name} className="w-full rounded-lg shadow-md aspect-square object-cover" />
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-center mb-2">Результат</h3>
            <div className="w-full aspect-square bg-white/50 rounded-lg flex justify-center items-center text-center p-4 relative">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col justify-center items-center bg-brand-cream/80 rounded-lg">
                        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-brown"></div>
                        <p className="mt-4 font-semibold text-brand-charcoal">Магия в процессе...</p>
                    </div>
                )}
                
                {!isLoading && generatedImage && (
                    <img src={generatedImage} alt="Сгенерированное изображение обивки" className="w-full h-full rounded-lg shadow-md object-cover" />
                )}

                {!isLoading && !generatedImage && (
                    <p className="text-gray-500">Здесь появится ваше уникальное творение</p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};