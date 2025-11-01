// Fix: Replaced placeholder content with a functional AiConsultantModal component.
// The logic is based on the unused StyleFinderModal, which aligns with the feature's requirements.
import React, { useState } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { XMarkIcon, SparklesIcon } from './Icons';
import { getStyleRecommendations } from '../services/geminiService';

interface AiConsultantModalProps {
  onClose: () => void;
  allProducts: Product[];
  onProductSelect: (productId: number) => void;
  initialPrompt?: string;
}

const AiConsultantModal: React.FC<AiConsultantModalProps> = ({ onClose, allProducts, onProductSelect, initialPrompt }) => {
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setRecommendedProducts([]);
        
        try {
            const recommendedNames = await getStyleRecommendations(prompt, allProducts);
            if (recommendedNames.length === 0) {
              setError("К сожалению, не удалось найти подходящие товары. Попробуйте переформулировать запрос.");
            }
            const foundProducts = allProducts.filter(p => recommendedNames.includes(p.name));
            setRecommendedProducts(foundProducts);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleProductClick = (productId: number) => {
        onClose();
        onProductSelect(productId);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-subtle-fade-in" onClick={onClose}>
            <div
                className="bg-brand-cream rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-6 border-b border-brand-cream-dark">
                    <h2 className="text-2xl font-serif text-brand-brown flex items-center">
                        <SparklesIcon className="w-6 h-6 mr-3"/>
                        ИИ-помощник по стилю
                    </h2>
                    <Button variant="ghost" onClick={onClose} className="p-2 -mr-2">
                        <XMarkIcon className="w-6 h-6"/>
                    </Button>
                </header>
                
                <div className="p-6 flex-grow overflow-y-auto">
                    <p className="mb-4 text-brand-charcoal">Опишите стиль комнаты, который вам нравится, и наш ИИ-помощник подберет для вас идеальную мебель. Например, "уютная спальня в скандинавском стиле с элементами бохо".</p>
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Опишите ваш стиль..."
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-brown h-28 resize-none"
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !prompt.trim()} className="w-full mt-4">
                            {isLoading ? 'Подбираем...' : 'Найти мебель'}
                        </Button>
                    </form>

                    {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

                    {recommendedProducts.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-semibold text-brand-charcoal mb-3">Рекомендованные товары:</h3>
                            <div className="space-y-3">
                                {recommendedProducts.map(product => (
                                    <div 
                                        key={product.id} 
                                        className="flex items-center gap-4 p-3 bg-white rounded-md cursor-pointer hover:shadow-md transition-shadow"
                                        onClick={() => handleProductClick(product.id)}
                                    >
                                        <img src={product.imageUrls[0]} alt={product.name} className="w-16 h-16 object-cover rounded" loading="lazy" />
                                        <div className="flex-grow">
                                            <p className="font-semibold">{product.name}</p>
                                            <p className="text-sm text-brand-brown">{product.price.toLocaleString('ru-RU')} ₽</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiConsultantModal;