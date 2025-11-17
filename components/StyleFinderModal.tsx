import React, { useState, memo } from 'react';
import type { Product, View } from '../types';
import { Button } from './Button';
import { XMarkIcon, SparklesIcon } from './Icons';
import { getStyleRecommendations } from '../services/geminiService';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

interface StyleFinderModalProps {
  allProducts: Product[];
  onClose: () => void;
  onNavigate: (view: View) => void;
}

type Step = 'input' | 'loading' | 'results';

export const StyleFinderModal: React.FC<StyleFinderModalProps> = memo(({ allProducts, onClose, onNavigate }) => {
    const [step, setStep] = useState<Step>('input');
    const [prompt, setPrompt] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    const handleSubmit = async () => {
        if (!prompt.trim()) {
            setError('Пожалуйста, опишите, что вы ищете.');
            return;
        }
        setStep('loading');
        setError(null);
        try {
            const recommendedNames = await getStyleRecommendations(prompt, allProducts);
            const recommendedProducts = allProducts.filter(p => recommendedNames.includes(p.name));
            if (recommendedProducts.length === 0) {
                setError('К сожалению, не удалось найти подходящую мебель. Попробуйте другой запрос.');
                setStep('input');
            } else {
                setResults(recommendedProducts);
                setStep('results');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Не удалось получить рекомендации.';
            setError(`Произошла ошибка: ${errorMessage}`);
            setStep('input');
        }
    };
    
    const handleReset = () => {
        setPrompt('');
        setResults([]);
        setError(null);
        setStep('input');
    };

    const renderContent = () => {
        switch (step) {
            case 'loading':
                return (
                    <div className="text-center py-10 flex flex-col items-center justify-center">
                        <SparklesIcon className="w-16 h-16 text-brand-brown mx-auto animate-pulse" />
                        <p className="mt-6 text-2xl font-serif text-brand-charcoal">Подбираю мебель...</p>
                        <p className="text-brand-charcoal/70 mt-2">Это может занять несколько секунд.</p>
                        <div className="w-full max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10">
                            <ProductCardSkeleton />
                            <ProductCardSkeleton />
                        </div>
                    </div>
                );
            case 'results':
                return (
                    <div className="animate-subtle-fade-in">
                        <h3 className="text-3xl font-serif text-brand-brown text-center mb-2">Ваша персональная подборка</h3>
                        <p className="text-center text-brand-charcoal/80 mb-8">Основано на вашем запросе: &quot;{prompt}&quot;</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map(p => (
                                <ProductCard 
                                    key={p.id} 
                                    product={p} 
                                    onProductSelect={(id) => onNavigate({ page: 'product', productId: id })} 
                                />
                            ))}
                        </div>
                        <div className="text-center mt-10">
                            <Button variant="outline" onClick={handleReset}>
                                Начать заново
                            </Button>
                        </div>
                    </div>
                );
            case 'input':
            default:
                return (
                    <div className="w-full max-w-2xl mx-auto text-center animate-subtle-fade-in">
                        <SparklesIcon className="w-16 h-16 text-brand-brown mx-auto mb-4" />
                        <h3 className="text-4xl font-serif text-brand-brown mb-4">Ваш персональный AI-стилист</h3>
                        <p className="text-lg text-brand-charcoal/80 mb-8">Опишите интерьер своей мечты, и я подберу для вас идеальную мебель.</p>
                        <textarea
                            value={prompt}
                            onChange={(e) => {
                                setPrompt(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="Например: уютная спальня в скандинавском стиле с большой деревянной кроватью и светлым комодом..."
                            className="w-full h-32 p-4 text-lg border-2 border-brand-cream-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown resize-none bg-white text-brand-charcoal placeholder:text-brand-charcoal/60"
                        />
                        {error && <p className="text-red-500 text-left mt-2">{error}</p>}
                        <Button size="lg" className="mt-6" onClick={handleSubmit}>
                            Подобрать мебель
                        </Button>
                    </div>
                );
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div 
              className="bg-brand-cream rounded-2xl shadow-2xl w-full h-full flex flex-col animate-scale-in"
              onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 absolute top-0 left-0 right-0 z-10">
                     <div className="text-2xl font-serif text-brand-brown">Aura AI Stylist</div>
                    <Button variant="ghost" onClick={onClose} className="p-2 text-brand-charcoal hover:bg-black/10 rounded-full">
                        <XMarkIcon className="w-7 h-7"/>
                    </Button>
                </header>
                <div className="p-8 sm:p-16 flex-grow overflow-y-auto flex items-center justify-center">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
});

StyleFinderModal.displayName = 'StyleFinderModal';
