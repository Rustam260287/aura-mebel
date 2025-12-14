
import React, { useState, useCallback } from 'react';
import { Button } from './Button';
import { PhotoIcon, ArrowPathIcon } from './Icons';
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
                furnitureName: "Дизайнерский предмет мебели (AI)",
                blueprint: {
                    estimatedDimensions: [dimensions.width, dimensions.height, dimensions.depth],
                    materials: ["Дерево", "Текстиль премиум", "Металл"]
                },
                priceEstimate: {
                    materialsCost: 15000,
                    laborCost: 10000,
                    totalPrice: 25000
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
                category: 'Custom',
                description: `Мебель по вашему фото. Габариты: ${dimensions.width}x${dimensions.height}x${dimensions.depth} см. Материалы: ${blueprint.blueprint.materials.join(', ')}.`,
                rating: 0,
                reviews: [],
                details: {
                    dimensions: `${dimensions.width}x${dimensions.height}x${dimensions.depth} см`,
                    material: blueprint.blueprint.materials.join(', '),
                    care: 'Индивидуальные рекомендации после изготовления'
                }
            };
            addToCart(customProduct);
        }
    };

    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-4xl font-serif text-brand-brown text-center mb-8">Мебель по вашему фото</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    {!preview && (
                        <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-12 text-center h-full hover:bg-gray-50 transition-colors">
                            <PhotoIcon className="w-16 h-16 text-gray-400 mb-4" />
                            <span className="text-lg font-medium text-brand-charcoal">Нажмите, чтобы загрузить фото</span>
                            <span className="text-sm text-gray-500">PNG, JPG, WEBP до 10MB</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                    )}
                    {preview && (
                        <div className="relative">
                            <div className="relative rounded-lg shadow-lg w-full max-h-[500px] h-full">
                                <Image
                                    src={preview}
                                    alt="Превью загруженного фото"
                                    className="object-contain rounded-lg"
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    unoptimized
                                />
                            </div>
                            <button onClick={() => { setPreview(null); setImage(null); setBlueprint(null); }} className="absolute top-2 right-2 bg-white/80 hover:bg-white p-2 rounded-full shadow text-gray-600">
                                ✕
                            </button>
                        </div>
                    )}
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-medium mb-4">Параметры</h3>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Желаемые габариты (см)</label>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <span className="text-xs text-gray-500">Ширина</span>
                                <input type="number" value={dimensions.width} onChange={e => setDimensions(d => ({...d, width: e.target.value}))} className="w-full p-2 border rounded mt-1" placeholder="Ширина"/>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">Высота</span>
                                <input type="number" value={dimensions.height} onChange={e => setDimensions(d => ({...d, height: e.target.value}))} className="w-full p-2 border rounded mt-1" placeholder="Высота"/>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">Глубина</span>
                                <input type="number" value={dimensions.depth} onChange={e => setDimensions(d => ({...d, depth: e.target.value}))} className="w-full p-2 border rounded mt-1" placeholder="Глубина"/>
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleGenerate} disabled={!image || isLoading} className="w-full py-4 text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                        {isLoading ? <span className="flex items-center justify-center"><ArrowPathIcon className="w-6 h-6 animate-spin mr-2"/> Анализ изображения...</span> : 'Рассчитать стоимость и чертеж'}
                    </Button>
                    
                    {blueprint && (
                        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg border-t-4 border-brand-brown animate-fade-in-up">
                            <h2 className="text-2xl font-serif text-brand-brown mb-4">{blueprint.furnitureName}</h2>
                            <div className="space-y-2 text-sm text-gray-600 mb-6">
                                <p><strong>Материалы:</strong> {blueprint.blueprint.materials.join(', ')}</p>
                                <p><strong>Габариты:</strong> {blueprint.blueprint.estimatedDimensions.join(' x ')} см</p>
                                <div className="my-4 border-t pt-4">
                                    <div className="flex justify-between text-gray-500"><span>Материалы:</span> <span>{blueprint.priceEstimate.materialsCost} ₽</span></div>
                                    <div className="flex justify-between text-gray-500"><span>Работа:</span> <span>{blueprint.priceEstimate.laborCost} ₽</span></div>
                                    <div className="flex justify-between text-xl font-bold text-brand-charcoal mt-2"><span>Итого:</span> <span>{blueprint.priceEstimate.totalPrice.toLocaleString('ru-RU')} ₽</span></div>
                                </div>
                            </div>
                            <Button className="w-full" onClick={handleAddToCart} variant="outline">
                                Добавить в корзину как спецзаказ
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
