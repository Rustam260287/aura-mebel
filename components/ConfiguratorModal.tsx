
import React, { useState, useMemo } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { XMarkIcon, SparklesIcon }  from './Icons';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { getAiConfigurationDescription } from '../services/geminiService';

interface ConfiguratorModalProps {
  product: Product;
  onClose: () => void;
}

export const ConfiguratorModal: React.FC<ConfiguratorModalProps> = ({ product, onClose }) => {
    const { addToCart } = useCart();
    const { addToast } = useToast();

    // Initialize state with default choices
    const initialOptions = useMemo(() => {
        const options: Record<string, string> = {};
        product.configurationOptions?.forEach(option => {
            if (option.choices.length > 0) {
                options[option.id] = option.choices[0].name;
            }
        });
        return options;
    }, [product]);

    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(initialOptions);
    const [aiDescription, setAiDescription] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOptionChange = (optionId: string, value: string) => {
        setSelectedOptions(prev => ({ ...prev, [optionId]: value }));
        setAiDescription(null); // Reset AI description when options change
    };

    const handleGenerateDescription = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const description = await getAiConfigurationDescription(product.name, selectedOptions);
            setAiDescription(description);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCart = () => {
        addToCart(product, selectedOptions);
        addToast(`${product.name} (конфигурация) добавлен в корзину`, 'success');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-subtle-fade-in" onClick={onClose}>
            <div
                className="bg-brand-cream rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row"
                onClick={e => e.stopPropagation()}
            >
                <header className="absolute top-4 right-4 z-10">
                    <Button variant="ghost" onClick={onClose} className="p-2">
                        <XMarkIcon className="w-6 h-6"/>
                    </Button>
                </header>
                
                <div className="md:w-1/2 h-64 md:h-auto bg-cover bg-center rounded-t-lg md:rounded-l-lg md:rounded-t-none" style={{ backgroundImage: `url(${product.imageUrls[0]})` }}>
                    {/* Visual Preview Area */}
                </div>

                <div className="md:w-1/2 p-8 flex flex-col overflow-y-auto">
                    <h2 className="text-3xl font-serif text-brand-brown mb-4">Конфигуратор</h2>
                    <p className="text-xl font-semibold text-brand-charcoal mb-6">{product.name}</p>

                    <div className="space-y-6">
                        {product.configurationOptions?.map(option => (
                            <div key={option.id}>
                                <label className="text-lg font-semibold text-brand-charcoal">{option.name}</label>
                                <select
                                    className="w-full mt-2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-brown bg-white text-brand-charcoal"
                                    value={selectedOptions[option.id]}
                                    onChange={(e) => handleOptionChange(option.id, e.target.value)}
                                >
                                    {option.choices.map(choice => (
                                        <option key={choice.name} value={choice.name}>
                                            {choice.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8">
                        <Button onClick={handleGenerateDescription} disabled={isLoading} variant="outline" className="w-full">
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {isLoading ? 'Генерация...' : 'Сгенерировать ИИ-описание'}
                        </Button>
                        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
                        {aiDescription && (
                            <div className="mt-4 p-4 bg-white/70 rounded-md border border-brand-gold">
                                <p className="text-brand-charcoal italic">{aiDescription}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-8">
                         <div className="flex justify-between items-center mb-4 text-lg">
                            <span className="font-semibold text-brand-charcoal">Итоговая цена:</span>
                            <span className="font-serif text-brand-brown text-2xl">{product.price.toLocaleString('ru-RU')} ₽</span>
                        </div>
                        <Button size="lg" className="w-full" onClick={handleAddToCart}>
                            Добавить в корзину
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};