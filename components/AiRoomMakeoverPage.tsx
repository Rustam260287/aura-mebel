import React, { useState, useCallback, DragEvent, memo, useRef, useEffect } from 'react';
import type { Product, View } from '../types';
import { Button } from './Button';
import { PhotoIcon, SparklesIcon, LoadingIcon, ArrowDownTrayIcon } from './Icons';
import { fileToBase64 } from '../utils';
import { generateRoomMakeover } from '../services/geminiService';
import { ProductCard } from './ProductCard';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { useToast } from '../contexts/ToastContext';

interface AiRoomMakeoverPageProps {
  allProducts: Product[];
  onNavigate: (view: View) => void;
}

// Expanded list of styles, including office styles
const designStyles = [
    { name: 'Скандинавский', imageSeed: 'scandinavian-interior-design' },
    { name: 'Лофт', imageSeed: 'loft-interior-design' },
    { name: 'Мид-сенчури', imageSeed: 'mid-century-modern-interior' },
    { name: 'Минимализм', imageSeed: 'minimalist-interior-design' },
    { name: 'Бохо', imageSeed: 'boho-interior-design' },
    { name: 'Современный', imageSeed: 'contemporary-interior-design' },
    { name: 'Офис в стиле лофт', imageSeed: 'loft-office-design' },
    { name: 'Эко-офис', imageSeed: 'eco-office-design' },
    { name: 'Биофильный офис', imageSeed: 'biophilic-office-design' },
];

export const AiRoomMakeoverPage: React.FC<AiRoomMakeoverPageProps> = memo(({ allProducts, onNavigate }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [selectedStyle, setSelectedStyle] = useState(designStyles[0].name);
    const { addToast } = useToast();
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (generatedImage) {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [generatedImage]);

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
    
    const handleDownloadImage = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `aura_makeover_${selectedStyle.toLowerCase().replace(' ', '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                <div className="bg-white p-8 rounded-lg shadow-lg space-y-6 lg:sticky lg:top-24">
                    <div>
                        <h3 className="text-xl font-semibold text-brand-charcoal mb-3">1. Загрузите фото вашей комнаты</h3>
                        <UploadBox onFile={handleFile} isDragOver={isDragOver} setIsDragOver={setIsDragOver} imagePreview={imagePreview} />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-brand-charcoal mb-3">2. Выберите стиль</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {designStyles.map(style => (
                                <StyleCard 
                                    key={style.name} 
                                    style={style} 
                                    isSelected={selectedStyle === style.name} 
                                    onClick={() => setSelectedStyle(style.name)} 
                                    disabled={isLoading}
                                />
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
                <div ref={resultsRef} className="bg-white p-8 rounded-lg shadow-lg min-h-[600px] flex flex-col items-center justify-center">
                    {isLoading ? (
                        <LoadingState />
                    ) : generatedImage && imagePreview ? (
                        <div className="w-full animate-subtle-fade-in">
                            <h3 className="text-2xl font-serif text-brand-charcoal mb-4 text-center">Ваш новый интерьер</h3>
                            <BeforeAfterSlider beforeImage={imagePreview} afterImage={generatedImage} />
                            <Button variant="outline" onClick={handleDownloadImage} className="w-full mt-4">
                                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                                Скачать результат
                            </Button>
                        </div>
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

const UploadBox: React.FC<{onFile: (file: File) => void; isDragOver: boolean; setIsDragOver: (isOver: boolean) => void; imagePreview: string | null;}> = ({ onFile, isDragOver, setIsDragOver, imagePreview }) => (
    <label
        onDragOver={(e: DragEvent) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e: DragEvent) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={(e: DragEvent) => { e.preventDefault(); setIsDragOver(false); onFile(e.dataTransfer.files[0]); }}
        className={`relative flex justify-center items-center w-full h-48 border-2 ${isDragOver ? 'border-brand-brown' : 'border-gray-300'} border-dashed rounded-md cursor-pointer transition-colors bg-brand-cream/30 hover:bg-brand-cream/60 overflow-hidden`}
    >
        {imagePreview ? (
            <img src={imagePreview} alt="Предпросмотр комнаты" className="w-full h-full object-cover" />
        ) : (
            <div className="space-y-1 text-center">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                    <span className="relative font-medium text-brand-brown hover:text-brand-brown-dark">
                        <span>Загрузите файл</span>
                        <input type="file" className="sr-only" onChange={(e) => e.target.files && onFile(e.target.files[0])} accept="image/png, image/jpeg, image/webp" />
                    </span>
                    <p className="pl-1">или перетащите</p>
                </div>
            </div>
        )}
    </label>
);

const StyleCard: React.FC<{style: {name: string, imageSeed: string}, isSelected: boolean, onClick: () => void, disabled: boolean}> = ({style, isSelected, onClick, disabled}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`relative rounded-lg overflow-hidden group border-2 transition-all duration-200 ${isSelected ? 'border-brand-brown ring-2 ring-brand-brown ring-offset-2' : 'border-transparent hover:border-brand-brown/50'} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
        <img src={`https://picsum.photos/seed/${style.imageSeed}/200/200`} alt={style.name} className="w-full h-24 object-cover" />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
        <span className="absolute bottom-1 left-0 right-0 text-white text-xs sm:text-sm font-semibold text-center drop-shadow-md p-1 bg-black/30">{style.name}</span>
        {isSelected && <div className="absolute inset-0 animate-pulse border-2 border-white/80 rounded-lg"></div>}
    </button>
);


const LoadingState: React.FC = () => (
    <div className="text-center text-brand-charcoal p-8">
        <SparklesIcon className="w-24 h-24 mx-auto text-brand-brown animate-pulse" />
        <h3 className="text-2xl font-serif mt-6">Наш ИИ-дизайнер работает...</h3>
        <p className="text-gray-600 mt-2">Подбираем мебель, настраиваем освещение. Это может занять до минуты.</p>
    </div>
)
