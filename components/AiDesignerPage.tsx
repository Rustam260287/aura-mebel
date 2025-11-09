import React, { useState, memo, useCallback, useMemo } from 'react';
import type { Product, View } from '../types';
import { Button } from './Button';
import { SparklesIcon, LoadingIcon, ArrowPathIcon, SofaIcon, BedIcon, BuildingStorefrontIcon, ComputerDesktopIcon, ChevronLeftIcon } from './Icons';
import { generateInteriorDesign } from '../services/geminiService';
import { ProductCard } from './ProductCard';
import { useToast } from '../contexts/ToastContext';

interface AiDesignerPageProps {
  allProducts: Product[];
  onNavigate: (view: View) => void;
}

// Step Data
const roomTypes = [
  { name: 'Гостиная', icon: <SofaIcon className="w-12 h-12" /> },
  { name: 'Спальня', icon: <BedIcon className="w-12 h-12" /> },
  { name: 'Кухня/Столовая', icon: <BuildingStorefrontIcon className="w-12 h-12" /> },
  { name: 'Кабинет', icon: <ComputerDesktopIcon className="w-12 h-12" /> },
];

const designStyles = [
  { name: 'Скандинавский', imageSeed: 'scandinavian-interior-design' },
  { name: 'Лофт', imageSeed: 'loft-interior-design' },
  { name: 'Минимализм', imageSeed: 'minimalist-interior-design' },
  { name: 'Мид-сенчури', imageSeed: 'mid-century-modern-interior' },
  { name: 'Бохо', imageSeed: 'boho-interior-design' },
  { name: 'Современный', imageSeed: 'contemporary-interior-design' },
];

const colorPalettes = [
  { name: 'Теплые нейтральные', colors: ['#F5F5DC', '#EADDCA', '#D2B48C'], description: 'бежевый, кремовый, светло-коричневый' },
  { name: 'Морской бриз', colors: ['#B0E0E6', '#FFFFFF', '#F5DEB3'], description: 'светло-голубой, белый, песочный' },
  { name: 'Лесная прохлада', colors: ['#2E8B57', '#808080', '#A0522D'], description: 'зеленый, серый, древесные тона' },
  { name: 'Монохромный шик', colors: ['#000000', '#FFFFFF', '#808080'], description: 'черный, белый, серый' },
  { name: 'Пыльная роза', colors: ['#D8BFD8', '#C0C0C0', '#FFD700'], description: 'пыльная роза, серый, золотые акценты' },
  { name: 'Терракотовый закат', colors: ['#E2725B', '#FBF9F4', '#5D4037'], description: 'терракотовый, кремовый, темно-коричневый' },
];


const Stepper: React.FC<{ currentStep: number }> = memo(({ currentStep }) => {
    const steps = ['Тип комнаты', 'Стиль', 'Палитра', 'Результат'];
    return (
        <div className="flex justify-center items-center mb-12">
            {steps.map((step, index) => (
                <React.Fragment key={step}>
                    <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                            currentStep > index + 1 ? 'bg-green-500 text-white' :
                            currentStep === index + 1 ? 'bg-brand-brown text-white scale-110' :
                            'bg-brand-cream-dark text-brand-charcoal/50'
                        }`}>
                            {currentStep > index + 1 ? '✔' : index + 1}
                        </div>
                        <span className={`ml-3 font-semibold ${currentStep === index + 1 ? 'text-brand-brown' : 'text-brand-charcoal/70'}`}>{step}</span>
                    </div>
                    {index < steps.length - 1 && <div className="flex-auto border-t-2 transition-all duration-500 mx-4_hidden md:block_hidden sm:block_hidden xs:block_hidden" style={{ borderColor: currentStep > index + 1 ? '#22c55e' : '#e5e7eb' }}></div>}
                </React.Fragment>
            ))}
        </div>
    );
});

export const AiDesignerPage: React.FC<AiDesignerPageProps> = memo(({ allProducts, onNavigate }) => {
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState({ room: '', style: '', palette: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ generatedImage: string; recommendedProducts: Product[] } | null>(null);
    const { addToast } = useToast();

    const handleSelect = useCallback((key: keyof typeof selection, value: string) => {
        setSelection(prev => ({ ...prev, [key]: value }));
        setStep(prev => prev + 1);
    }, []);

    const handleBack = useCallback(() => {
        setStep(prev => Math.max(1, prev - 1));
    }, []);

    const handleGenerate = useCallback(async () => {
        setStep(4); // Move to loading step
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const { generatedImage, recommendedProductNames } = await generateInteriorDesign(
                selection.room, selection.style, selection.palette, allProducts
            );
            const recommendedProducts = allProducts.filter(p => recommendedProductNames.includes(p.name));

            if (recommendedProductNames.length === 0 && generatedImage) {
                addToast("Дизайн создан! К сожалению, не удалось подобрать товары из каталога.", 'info');
            }

            setResult({ generatedImage, recommendedProducts });
            setStep(5); // Move to results step
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка.');
            setStep(3); // Go back to palette selection
        } finally {
            setIsLoading(false);
        }
    }, [selection, allProducts, addToast]);
    
    const handleReset = useCallback(() => {
        setStep(1);
        setSelection({ room: '', style: '', palette: '' });
        setResult(null);
        setError(null);
    }, []);

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return <StepRoomType onSelect={(room) => handleSelect('room', room)} />;
            case 2:
                return <StepStyle onSelect={(style) => handleSelect('style', style)} onBack={handleBack} />;
            case 3:
                return <StepPalette onSelect={(palette) => {
                    setSelection(prev => ({ ...prev, palette: palette }));
                    handleGenerate(); // Automatically generate after last selection
                }} onBack={handleBack} error={error} />;
            case 4:
                return <LoadingState />;
            case 5:
                return <ResultsState result={result!} onNavigate={onNavigate} onReset={handleReset} />;
            default:
                return <StepRoomType onSelect={(room) => handleSelect('room', room)} />;
        }
    };
    
    return (
        <div className="container mx-auto px-6 py-12">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-serif text-brand-brown mb-3">AI Дизайнер интерьеров</h1>
                <p className="text-lg text-brand-charcoal max-w-3xl mx-auto">
                    Пройдите 3 простых шага, и наш ИИ создаст уникальный дизайн-проект для вашей комнаты.
                </p>
            </div>
            <div className="max-w-6xl mx-auto">
                 <Stepper currentStep={step} />
                <div className="bg-white p-4 sm:p-8 rounded-lg shadow-xl min-h-[400px] flex items-center justify-center">
                    {renderStepContent()}
                </div>
            </div>
        </div>
    );
});

// Step Components
const StepHeader: React.FC<{ title: string; onBack?: () => void }> = ({ title, onBack }) => (
    <div className="w-full text-center mb-8 relative">
        {onBack && (
            <Button variant="ghost" onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 !p-2">
                <ChevronLeftIcon className="w-6 h-6" />
            </Button>
        )}
        <h2 className="text-3xl font-serif text-brand-charcoal">{title}</h2>
    </div>
);


const StepRoomType: React.FC<{ onSelect: (room: string) => void }> = memo(({ onSelect }) => (
    <div className="w-full animate-subtle-fade-in">
        <StepHeader title="1. Выберите тип комнаты" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {roomTypes.map(room => (
                <div key={room.name} onClick={() => onSelect(room.name)} className="p-6 bg-brand-cream/50 rounded-lg shadow-sm text-center flex flex-col items-center justify-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer text-brand-brown">
                    <div className="mb-3">{room.icon}</div>
                    <h3 className="text-lg font-semibold">{room.name}</h3>
                </div>
            ))}
        </div>
    </div>
));


const StepStyle: React.FC<{ onSelect: (style: string) => void; onBack: () => void }> = memo(({ onSelect, onBack }) => (
    <div className="w-full animate-subtle-fade-in">
        <StepHeader title="2. Выберите стиль" onBack={onBack} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {designStyles.map(style => (
                <button key={style.name} onClick={() => onSelect(style.name)} className="relative rounded-lg overflow-hidden group border-2 border-transparent hover:border-brand-brown/50 transition-all duration-200">
                    <img src={`https://picsum.photos/seed/${style.imageSeed}/300/200`} alt={style.name} className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
                    <span className="absolute bottom-1 left-0 right-0 text-white font-semibold text-center drop-shadow-md p-1 bg-black/30">{style.name}</span>
                </button>
            ))}
        </div>
    </div>
));

const StepPalette: React.FC<{ onSelect: (palette: string) => void; onBack: () => void, error: string | null }> = memo(({ onSelect, onBack, error }) => (
    <div className="w-full animate-subtle-fade-in">
        <StepHeader title="3. Выберите цветовую палитру" onBack={onBack} />
         {error && <p className="text-center text-red-600 bg-red-100 p-3 rounded-md mb-6">{error}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {colorPalettes.map(palette => (
                <div key={palette.name} onClick={() => onSelect(palette.description)} className="p-4 bg-brand-cream/50 rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    <div className="flex justify-center gap-1 mb-2 h-12">
                        {palette.colors.map(color => (
                            <div key={color} className="w-1/3 rounded" style={{ backgroundColor: color }}></div>
                        ))}
                    </div>
                    <h4 className="font-semibold text-center text-brand-charcoal">{palette.name}</h4>
                </div>
            ))}
        </div>
    </div>
));


const LoadingState: React.FC = memo(() => (
    <div className="text-center text-brand-charcoal p-8">
        <SparklesIcon className="w-24 h-24 mx-auto text-brand-brown animate-pulse" />
        <h3 className="text-2xl font-serif mt-6">Создаем ваш идеальный интерьер...</h3>
        <p className="text-gray-600 mt-2">Это может занять до минуты. Искусство требует времени!</p>
    </div>
));

const ResultsState: React.FC<{
    result: { generatedImage: string; recommendedProducts: Product[] };
    onNavigate: (view: View) => void;
    onReset: () => void;
}> = memo(({ result, onNavigate, onReset }) => (
    <div className="w-full animate-subtle-fade-in">
        <StepHeader title="Ваш персональный дизайн-проект!" />
        <div className="w-full aspect-video mx-auto rounded-lg overflow-hidden shadow-xl mb-8">
            <img src={`data:image/png;base64,${result.generatedImage}`} alt="Сгенерированный интерьер" className="w-full h-full object-cover" />
        </div>

        {result.recommendedProducts.length > 0 && (
            <>
                <h3 className="text-2xl font-serif text-brand-charcoal mb-6 text-center">Мебель из этого проекта</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {result.recommendedProducts.map(product => (
                        <ProductCard key={product.id} product={product} onProductSelect={(id) => onNavigate({ page: 'product', productId: id })} />
                    ))}
                </div>
            </>
        )}
        
        <div className="text-center mt-12">
            <Button onClick={onReset} size="lg">
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Создать новый дизайн
            </Button>
        </div>
    </div>
));