import React, { useState, useCallback } from 'react';
import { Button } from './Button';
import { PhotoIcon, ArrowPathIcon } from './Icons';
import { FurnitureBlueprint, Product } from '../types';
import { fileToBase64 } from '../utils';
import { useCart } from '../contexts/CartContext';

export const FurnitureFromPhotoPage = () => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState({ width: '100', height: '80', depth: '60' });
    const [isLoading, setIsLoading] = useState(false);
    const [blueprint, setBlueprint] = useState<FurnitureBlueprint | null>(null);
    const { addToCart } = useCart();

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
            const base64String = await fileToBase64(image);
            // const bp = await generateFurnitureFromPhoto(base64, mimeType, dimensions);
            // setBlueprint(bp);
            console.log("Furniture from photo functionality is not implemented yet.");
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
                description: 'Мебель, изготовленная по вашему фото.',
                rating: 0,
                reviews: [],
                details: {
                    dimensions: `${dimensions.width}x${dimensions.height}x${dimensions.depth} см`,
                    material: 'На заказ',
                    care: 'Индивидуальные рекомендации'
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
                        <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-12 text-center h-full">
                            <PhotoIcon className="w-16 h-16 text-gray-400 mb-4" />
                            <span className="text-lg font-medium text-brand-charcoal">Нажмите, чтобы загрузить фото</span>
                            <span className="text-sm text-gray-500">PNG, JPG, WEBP до 10MB</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                    )}
                    {preview && <img src={preview} alt="Upload preview" className="rounded-lg shadow-lg w-full" />}
                </div>
                <div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Желаемые габариты (см)</label>
                        <div className="flex gap-4">
                            <input type="number" value={dimensions.width} onChange={e => setDimensions(d => ({...d, width: e.target.value}))} className="w-full p-2 border rounded" placeholder="Ширина"/>
                            <input type="number" value={dimensions.height} onChange={e => setDimensions(d => ({...d, height: e.target.value}))} className="w-full p-2 border rounded" placeholder="Высота"/>
                            <input type="number" value={dimensions.depth} onChange={e => setDimensions(d => ({...d, depth: e.target.value}))} className="w-full p-2 border rounded" placeholder="Глубина"/>
                        </div>
                    </div>
                    <Button onClick={handleGenerate} disabled={!image || isLoading} className="w-full">
                        {isLoading ? <><ArrowPathIcon className="w-5 h-5 animate-spin mr-2"/> Анализ...</> : 'Сгенерировать чертеж'}
                    </Button>
                    {blueprint && (
                        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold text-brand-brown mb-4">{blueprint.furnitureName}</h2>
                            <p><strong>Примерная стоимость:</strong> {blueprint.priceEstimate.totalPrice.toLocaleString('ru-RU')} ₽</p>
                            <Button className="mt-4" onClick={handleAddToCart}>
                                Добавить в корзину как спецзаказ
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
