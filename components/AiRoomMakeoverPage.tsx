import React, { useState, useCallback, DragEvent, memo } from 'react';
import type { Product, View } from '../types';
import { Button } from './Button';
import { PhotoIcon, SparklesIcon, LoadingIcon } from './Icons';
import { fileToBase64 } from '../utils';
import { generateRoomMakeover } from '../services/geminiService';
import { ProductCard } from './ProductCard';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { useToast } from '../contexts/ToastContext';

interface AiRoomMakeoverPageProps {
  allProducts: Product[];
  onNavigate: (view: View) => void;
}

const designStyles = ['Скандинавский', 'Лофт', 'Мид-сенчури', 'Минимализм', 'Бохо', 'Современный', 'Современный офис', 'Эко-офис', 'Офис в стиле лофт', 'Индустриальный офис', 'Биофильный офис', 'Классический офис'];

export const AiRoomMakeoverPage: React.FC<AiRoomMakeoverPageProps> = memo(({ allProducts, onNavigate }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [selectedStyle, setSelectedStyle] = useState(designStyles[0]);
    const { addToast } = useToast();

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
            setGeneratedImage(null);
        } else {
            setError('Пожалуйста, выберите файл изображения (JPEG, PNG, WEBP).');
        }
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!imageFile) return;

        setIsLoading(true);
        setError(null);
        setRecommendedProducts([]);
        setGeneratedImage(null);

        try {
            const base64Image = await fileToBase64(imageFile);
            const { generatedImage: resultBase64, recommendedProductNames } = await generateRoomMakeover(base64Image, imageFile.type, selectedStyle, allProducts);
            
            setGeneratedImage(`data:image/png;base64,${resultBase64}`);

            if (recommendedProductNames.length > 0) {
                const foundProducts = allProducts.filter(p => recommendedProductNames.includes(p.name));
                setRecommendedProducts(foundProducts);
            } else if (resultBase64) {
                addToast("Дизайн создан! К сожалению, не удалось подобрать товары из каталога.", 'info');
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка при создании интерьера.');
        } finally {
            setIsLoading(false);
        }
    }, [imageFile, selectedStyle, allProducts, addToast]);

    const handleProductSelect = useCallback((productId: string) => {
        onNavigate({ page: 'product', productId });
    }, [onNavigate]);

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-serif text-brand-brown mb-3">AI Дизайнер интерьеров</h1>
                <p className="text-lg text-brand-charcoal max-w-3xl mx-auto">
                    Загрузите фото вашей комнаты, выберите стиль, и наш ИИ создаст дизайн-проект с мебелью из нашего магазина.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Controls */}
                <div className="bg-white p-8 rounded-lg shadow-lg space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold text-brand-charcoal mb-3">1. Загрузите фото вашей комнаты</h3>
                        <UploadBox onFile={handleFile} isDragOver={isDragOver} setIsDragOver={setIsDragOver} />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-brand-charcoal mb-3">2. Выберите стиль</h3>
                        <div className="flex flex-wrap gap-3">
                            {designStyles.map(style => (
                                <button
                                    key={style}
                                    onClick={() => setSelectedStyle(style)}
                                    disabled={isLoading}
                                    className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 text-sm ${
                                        selectedStyle === style
                                            ? 'bg-brand-brown text-white shadow-md'
                                            : 'bg-brand-cream-dark text-brand-charcoal hover:bg-brand-cream-dark/80 disabled:opacity-50'
                                    }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Button size="lg" className="w-full" onClick={handleSubmit} disabled={!imageFile || isLoading}>
                            {isLoading ? (
                                <>
                                    <LoadingIcon className="w-6 h-6 mr-3 animate-spin" />
                                    Создаем дизайн...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-6 h-6 mr-3" />
                                    Преобразить интерьер
                                </>
                            )}
                        </Button>
                    </div>
                    {error && <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                </div>

                {/* Results */}
                <div className="bg-white p-8 rounded-lg shadow-lg min-h-[400px] flex flex-col items-center justify-center">
                    {isLoading ? (
                        <LoadingState />
                    ) : generatedImage && imagePreview ? (
                        <BeforeAfterSlider beforeImage={imagePreview} afterImage={generatedImage} />
                    ) : imagePreview ? (
                         <img src={imagePreview} alt="Предпросмотр комнаты" className="rounded-lg shadow-md w-full max-w-full object-contain" />
                    ) : (
                        <div className="text-center text-gray-500">
                            <SparklesIcon className="w-24 h-24 mx-auto text-gray-300" />
                            <p className="mt-4 text-lg">Здесь появится ваш новый интерьер</p>
                        </div>
                    )}
                </div>
            </div>
            
            {recommendedProducts.length > 0 && !isLoading && (
                 <div className="mt-16 animate-subtle-fade-in">
                    <h2 className="text-3xl font-serif text-brand-charcoal mb-8 text-center">Мебель из этого интерьера</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {recommendedProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onProductSelect={handleProductSelect}
                        />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

const UploadBox: React.FC<{onFile: (file: File) => void; isDragOver: boolean; setIsDragOver: (isOver: boolean) => void;}> = ({ onFile, isDragOver, setIsDragOver }) => (
    <label
        onDragOver={(e: DragEvent) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e: DragEvent) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={(e: DragEvent) => { e.preventDefault(); setIsDragOver(false); onFile(e.dataTransfer.files[0]); }}
        className={`flex justify-center w-full h-48 px-6 py-5 border-2 ${isDragOver ? 'border-brand-brown' : 'border-gray-300'} border-dashed rounded-md cursor-pointer transition-colors bg-brand-cream/30 hover:bg-brand-cream/60`}
    >
        <div className="space-y-1 text-center self-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
                <span className="relative font-medium text-brand-brown hover:text-brand-brown-dark">
                    <span>Загрузите файл</span>
                    <input type="file" className="sr-only" onChange={(e) => e.target.files && onFile(e.target.files[0])} accept="image/png, image/jpeg, image/webp" />
                </span>
                <p className="pl-1">или перетащите его сюда</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP до 10MB</p>
        </div>
    </label>
);

const LoadingState: React.FC = () => (
    <div className="text-center text-brand-charcoal p-8">
        <SparklesIcon className="w-24 h-24 mx-auto text-brand-brown animate-pulse" />
        <h3 className="text-2xl font-serif mt-6">Наш ИИ-дизайнер работает...</h3>
        <p className="text-gray-600 mt-2">Подбираем мебель, настраиваем освещение. Это может занять до минуты.</p>
    </div>
)
