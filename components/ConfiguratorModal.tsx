import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import type { Product } from '../types';
import { Button } from './Button';
import { XMarkIcon, SparklesIcon, ArrowPathIcon, PaperAirplaneIcon } from './Icons';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { getAiConfigurationDescription, generateConfiguredImage } from '../services/geminiService';
import { imageUrlToBase64 } from '../utils';

interface ConfiguratorModalProps {
  product: Product;
  onClose: () => void;
}

export const ConfiguratorModal: React.FC<ConfiguratorModalProps> = memo(({ product, onClose }) => {
    const { addToCart } = useCart();
    const { addToast } = useToast();

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
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);

    const [currentImageUrl, setCurrentImageUrl] = useState(product.imageUrls[0]);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const isInitialMount = useRef(true);

    const handleOptionChange = (optionId: string, value: string) => {
        setSelectedOptions(prev => ({ ...prev, [optionId]: value }));
        setAiDescription(null);
        setDescriptionError(null);
    };

    useEffect(() => {
        if (isInitialMount.current || !product.configurationOptions) {
            isInitialMount.current = false;
            return;
        }

        const generateVisuals = async () => {
            setIsGeneratingImage(true);
            setImageError(null);
            try {
                const visualPrompt = product.configurationOptions
                    ?.map(opt => `${opt.name.toLowerCase()}: ${selectedOptions[opt.id]}`)
                    .join(', ');
                
                if (!visualPrompt) return;

                const { base64, mimeType } = await imageUrlToBase64(product.imageUrls[0]);
                const resultBase64 = await generateConfiguredImage(base64, mimeType, product.name, visualPrompt);
                setCurrentImageUrl(`data:image/png;base64,${resultBase64}`);
            } catch (err) {
                setImageError(err instanceof Error ? err.message : 'Не удалось обновить изображение.');
            } finally {
                setIsGeneratingImage(false);
            }
        };
        
        const handler = setTimeout(() => {
            generateVisuals();
        }, 500);

        return () => {
            clearTimeout(handler);
        };

    }, [selectedOptions, product]);

    const handleGenerateDescription = async () => {
        setIsGeneratingDescription(true);
        setDescriptionError(null);
        try {
            const description = await getAiConfigurationDescription(product.name, selectedOptions);
            setAiDescription(description);
        } catch (err) {
            setDescriptionError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка.');
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    const handleAddToCart = () => {
        addToCart(product, selectedOptions);
        addToast(`${product.name} (конфигурация) добавлен в корзину`, 'success');
        onClose();
    };

    const handleSendToWorkshop = () => {
        addToast('Макет отправлен в цех. Мы скоро с вами свяжемся!', 'success');
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
                
                <div className="md:w-1/2 relative bg-gray-100 rounded-t-lg md:rounded-l-lg md:rounded-t-none">
                    <img src={currentImageUrl} alt={`Конфигурация для ${product.name}`} className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none" />
                    {isGeneratingImage && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center text-white text-center p-4 rounded-t-lg md:rounded-l-lg md:rounded-t-none transition-opacity duration-300">
                            <ArrowPathIcon className="w-10 h-10 animate-spin" />
                            <p className="mt-4 font-semibold text-lg">Применяем изменения...</p>
                        </div>
                    )}
                </div>

                <div className="md:w-1/2 p-8 flex flex-col overflow-y-auto">
                    <h2 className="text-3xl font-serif text-brand-brown mb-4">Конфигуратор</h2>
                    <p className="text-xl font-semibold text-brand-charcoal mb-6">{product.name}</p>

                    <div className="space-y-6">
                        {product.configurationOptions?.map(option => (
                            <div key={option.id}>
                                <label className="text-lg font-semibold text-brand-charcoal">{option.name}</label>
                                <select
                                    className="w-full mt-2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-brown bg-white text-brand-charcoal disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={selectedOptions[option.id]}
                                    onChange={(e) => handleOptionChange(option.id, e.target.value)}
                                    disabled={isGeneratingImage}
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
                    {imageError && <div className="mt-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">{imageError}</div>}


                    <div className="mt-8">
                        <Button onClick={handleGenerateDescription} disabled={isGeneratingDescription || isGeneratingImage} variant="outline" className="w-full">
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {isGeneratingDescription ? 'Генерация...' : 'Сгенерировать ИИ-описание'}
                        </Button>
                        {descriptionError && <div className="mt-2 text-sm text-red-600">{descriptionError}</div>}
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
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" variant="outline" className="w-full" onClick={handleSendToWorkshop} disabled={isGeneratingImage}>
                                <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                                Отправить в цех
                            </Button>
                            <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={isGeneratingImage}>
                                Добавить в корзину
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});