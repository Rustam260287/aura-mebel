
import React, { useState, useCallback } from 'react';
import { Button } from './Button';
import { PhotoIcon } from './Icons';
import { ArrowPathIcon, ScaleIcon, WrenchScrewdriverIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { FurnitureBlueprint, Product } from '../types';
import { fileToBase64 } from '../utils';
import { useCartDispatch } from '../contexts/CartContext'; // ИСПРАВЛЕНО
import Image from 'next/image';

export const FurnitureFromPhotoPage = () => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState({ width: '100', height: '80', depth: '60' });
    const [isLoading, setIsLoading] = useState(false);
    const [blueprint, setBlueprint] = useState<FurnitureBlueprint | null>(null);
    const { addToCart } = useCartDispatch(); // ИСПРАВЛЕНО

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!image) return;
        setIsLoading(true);
        setBlueprint(null);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock response based on dimensions
            const mockBlueprint: FurnitureBlueprint = {
                furnitureName: "Эксклюзивный проект (AI Design)",
                blueprint: {
                    estimatedDimensions: [dimensions.width, dimensions.height, dimensions.depth],
                    materials: ["Массив дуба", "Итальянский велюр", "Латунь"]
                },
                priceEstimate: {
                    materialsCost: 25000,
                    laborCost: 15000,
                    totalPrice: 40000
                }
            };
            
            setBlueprint(mockBlueprint);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [image, dimensions]);

    const handleAddToCart = () => {
        if (blueprint && preview) {
            const customProduct: Product = {
                id: `custom-${Date.now()}`,
                name: blueprint.furnitureName,
                price: blueprint.priceEstimate.totalPrice,
                imageUrls: [preview],
                category: 'Индивидуальный заказ',
                description: `Мебель по вашему фото. Габариты: ${dimensions.width}x${dimensions.height}x${dimensions.depth} см. Материалы: ${blueprint.blueprint.materials.join(', ')}.`,
                rating: 5,
                reviews: [],
                specs: {
                    width: Number(dimensions.width),
                    height: Number(dimensions.height),
                    depth: Number(dimensions.depth)
                }
            };
            addToCart(customProduct);
        }
    };

    return (
        <div className="bg-[#FAF9F6] min-h-screen pb-20">
            {/* Hero */}
            <div className="bg-brand-brown text-white py-16 md:py-24 relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1595428774223-ef52624120d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-10"></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-brand-brown via-brand-brown/80 to-transparent"></div>
                 <div className="container mx-auto px-6 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Мебель по фото</h1>
                    <p className="text-xl text-white/80 max-w-2xl mx-auto font-light">
                        Загрузите фотографию понравившейся мебели, и наш AI рассчитает стоимость и предложит проект изготовления.
                    </p>
                 </div>
            </div>

            <div className="container mx-auto px-6 -mt-10 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    
                    {/* Left Column: Upload */}
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
                         {!preview ? (
                            <label className="w-full h-full min-h-[300px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-10 cursor-pointer hover:bg-gray-50 hover:border-brand-terracotta transition-all group">
                                <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <PhotoIcon className="w-10 h-10 text-brand-brown" />
                                </div>
                                <span className="text-xl font-medium text-brand-charcoal mb-2">Загрузить фото</span>
                                <span className="text-gray-400 text-sm">Нажмите или перетащите файл сюда</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                         ) : (
                            <div className="relative w-full h-full min-h-[400px]">
                                <Image
                                    src={preview}
                                    alt="Preview"
                                    fill
                                    className="object-contain rounded-lg"
                                />
                                <button 
                                    onClick={() => { setPreview(null); setImage(null); setBlueprint(null); }} 
                                    className="absolute top-4 right-4 bg-white/90 backdrop-blur text-brand-charcoal p-2 rounded-full shadow-md hover:bg-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                         )}
                    </div>

                    {/* Right Column: Controls & Result */}
                    <div className="space-y-6">
                         {/* Controls */}
                        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                             <div className="flex items-center gap-3 mb-6">
                                <ScaleIcon className="w-6 h-6 text-brand-brown" />
                                <h3 className="text-xl font-serif text-brand-charcoal font-bold">Параметры изделия</h3>
                             </div>
                             
                             <div className="grid grid-cols-3 gap-4 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ширина (см)</label>
                                    <input 
                                        type="number" 
                                        value={dimensions.width} 
                                        onChange={e => setDimensions(d => ({...d, width: e.target.value}))} 
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-brand-brown focus:outline-none focus:ring-2 focus:ring-brand-brown/20 transition-all font-medium text-brand-charcoal"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Высота (см)</label>
                                    <input 
                                        type="number" 
                                        value={dimensions.height} 
                                        onChange={e => setDimensions(d => ({...d, height: e.target.value}))} 
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-brand-brown focus:outline-none focus:ring-2 focus:ring-brand-brown/20 transition-all font-medium text-brand-charcoal"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Глубина (см)</label>
                                    <input 
                                        type="number" 
                                        value={dimensions.depth} 
                                        onChange={e => setDimensions(d => ({...d, depth: e.target.value}))} 
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-brand-brown focus:outline-none focus:ring-2 focus:ring-brand-brown/20 transition-all font-medium text-brand-charcoal"
                                    />
                                </div>
                             </div>

                             <Button 
                                onClick={handleGenerate} 
                                disabled={!image || isLoading} 
                                className="w-full py-4 text-sm uppercase tracking-widest font-bold shadow-lg shadow-brand-brown/20"
                             >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                        Анализ и расчет...
                                    </span>
                                ) : (
                                    'Рассчитать стоимость'
                                )}
                            </Button>
                        </div>

                        {/* Result Card */}
                        {blueprint && (
                            <div className="bg-white p-8 rounded-2xl shadow-xl border-l-4 border-brand-terracotta animate-fade-in-up">
                                <h2 className="text-2xl font-serif text-brand-charcoal mb-4">{blueprint.furnitureName}</h2>
                                
                                <div className="space-y-4 mb-6">
                                     <div className="flex items-start gap-3">
                                        <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Материалы</p>
                                            <p className="text-brand-charcoal font-medium">{blueprint.blueprint.materials.join(', ')}</p>
                                        </div>
                                     </div>
                                     <div className="flex items-start gap-3">
                                        <ScaleIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Размеры</p>
                                            <p className="text-brand-charcoal font-medium">{blueprint.blueprint.estimatedDimensions.join(' x ')} см</p>
                                        </div>
                                     </div>
                                </div>

                                <div className="bg-brand-cream/30 rounded-xl p-5 mb-6">
                                     <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
                                         <span>Материалы</span>
                                         <span>{blueprint.priceEstimate.materialsCost.toLocaleString('ru-RU')} ₽</span>
                                     </div>
                                     <div className="flex justify-between items-center mb-4 text-sm text-gray-600 border-b border-gray-200 pb-2">
                                         <span>Работа</span>
                                         <span>{blueprint.priceEstimate.laborCost.toLocaleString('ru-RU')} ₽</span>
                                     </div>
                                     <div className="flex justify-between items-center">
                                         <span className="font-serif font-bold text-xl text-brand-charcoal">Итого</span>
                                         <span className="font-serif font-bold text-2xl text-brand-brown">{blueprint.priceEstimate.totalPrice.toLocaleString('ru-RU')} ₽</span>
                                     </div>
                                </div>

                                <Button 
                                    onClick={handleAddToCart} 
                                    className="w-full bg-brand-charcoal hover:bg-brand-brown text-white shadow-none"
                                >
                                    Оформить индивидуальный заказ
                                </Button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
