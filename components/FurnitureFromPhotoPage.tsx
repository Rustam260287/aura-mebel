import React, { useState, useCallback, DragEvent, memo } from 'react';
import { Button } from './Button';
import { PhotoIcon, XMarkIcon, SparklesIcon, ArrowPathIcon } from './Icons';
import { generateFurnitureFromPhoto } from '../services/geminiService';
import { FurnitureBlueprint } from '../types';
import { fileToBase64 } from '../utils';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';

type Step = 'upload' | 'dimensions' | 'loading' | 'results';

export const FurnitureFromPhotoPage: React.FC = memo(() => {
    const [step, setStep] = useState<Step>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState({ width: '', height: '', depth: '' });
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<FurnitureBlueprint | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    
    const { addToCart } = useCart();
    const { addToast } = useToast();

    const handleFile = useCallback((file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setStep('dimensions');
            };
            reader.readAsDataURL(file);
            setError(null);
        } else {
            setError('Пожалуйста, выберите файл изображения (JPEG, PNG, WEBP).');
        }
    }, []);
    
    const handleReset = useCallback(() => {
        setStep('upload');
        setImageFile(null);
        setImagePreview(null);
        setDimensions({ width: '', height: '', depth: '' });
        setError(null);
        setResult(null);
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!imageFile || !dimensions.width || !dimensions.height || !dimensions.depth) {
            setError('Пожалуйста, укажите все габаритные размеры.');
            return;
        }
        setStep('loading');
        setError(null);
        try {
            const base64Image = await fileToBase64(imageFile);
            const blueprintResult = await generateFurnitureFromPhoto(base64Image, imageFile.type, dimensions);
            setResult(blueprintResult);
            setStep('results');
        } catch (err) {
            setError(err instanceof Error ? `Ошибка ИИ: ${err.message}` : 'Произошла неизвестная ошибка. Попробуйте снова.');
            setStep('dimensions');
        }
    }, [imageFile, dimensions]);

    const handleAddToCart = useCallback(() => {
        if (!result || !imagePreview) return;
        const customProduct = {
            id: `custom-${Date.now()}`,
            name: result.furnitureName,
            category: 'Кастом',
            price: result.priceEstimate.totalPrice,
            imageUrls: [imagePreview],
            description: `Изготовлено по вашему фото. Материалы: ${result.blueprint.materials.join(', ')}.`,
            details: {
                dimensions: `~${dimensions.width}x${dimensions.height}x${dimensions.depth} см`,
                material: 'Смешанные (по эскизу)',
                care: 'Индивидуальные рекомендации'
            },
            rating: 5,
            reviews: [],
        };
        addToCart(customProduct);
        addToast(`${result.furnitureName} добавлен в корзину!`, 'success');
    }, [result, imagePreview, dimensions, addToCart, addToast]);

    const renderStepContent = () => {
        switch (step) {
            case 'upload':
                return <UploadStep onFile={handleFile} isDragOver={isDragOver} setIsDragOver={setIsDragOver} />;
            case 'dimensions':
                return <DimensionsStep imagePreview={imagePreview!} dimensions={dimensions} setDimensions={setDimensions} onSubmit={handleSubmit} onBack={handleReset} />;
            case 'loading':
                return <LoadingStep imagePreview={imagePreview!} />;
            case 'results':
                return <ResultsStep result={result!} imagePreview={imagePreview!} onAddToCart={handleAddToCart} onReset={handleReset} />;
        }
    };

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-serif text-brand-brown mb-4">ИИ-Конструктор Мебели</h1>
                <p className="text-lg text-brand-charcoal mb-8 leading-relaxed">
                    Есть фото мебели мечты? Загрузите его, укажите размеры, и наш ИИ рассчитает стоимость и создаст план для производства!
                </p>
            </div>
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-2xl min-h-[400px] flex items-center justify-center">
                <div className="w-full">
                    {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">{error}</div>}
                    {renderStepContent()}
                </div>
            </div>
        </div>
    );
});

const UploadStep: React.FC<{onFile: (file: File) => void; isDragOver: boolean; setIsDragOver: (isOver: boolean) => void;}> = ({ onFile, isDragOver, setIsDragOver }) => (
    <label
        onDragOver={(e: DragEvent) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e: DragEvent) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={(e: DragEvent) => { e.preventDefault(); setIsDragOver(false); onFile(e.dataTransfer.files[0]); }}
        className={`flex justify-center w-full h-64 px-6 pt-5 pb-6 border-2 ${isDragOver ? 'border-brand-brown' : 'border-gray-300'} border-dashed rounded-md cursor-pointer transition-colors`}
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

const DimensionsStep: React.FC<{
    imagePreview: string;
    dimensions: { width: string; height: string; depth: string };
    setDimensions: React.Dispatch<React.SetStateAction<{ width: string; height: string; depth: string }>>;
    onSubmit: () => void;
    onBack: () => void;
}> = ({ imagePreview, dimensions, setDimensions, onSubmit, onBack }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-subtle-fade-in">
        <img src={imagePreview} alt="Предпросмотр" className="w-full h-auto max-h-96 object-contain rounded-md shadow-md" />
        <div className="space-y-4">
            <h3 className="text-2xl font-serif text-brand-brown">Укажите габариты (в см)</h3>
            <div>
                <label htmlFor="width" className="block text-sm font-medium text-gray-700">Ширина</label>
                <input type="number" name="width" id="width" value={dimensions.width} onChange={(e) => setDimensions(d => ({ ...d, width: e.target.value }))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" placeholder="180" />
            </div>
            <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700">Высота</label>
                <input type="number" name="height" id="height" value={dimensions.height} onChange={(e) => setDimensions(d => ({ ...d, height: e.target.value }))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" placeholder="85" />
            </div>
            <div>
                <label htmlFor="depth" className="block text-sm font-medium text-gray-700">Глубина</label>
                <input type="number" name="depth" id="depth" value={dimensions.depth} onChange={(e) => setDimensions(d => ({ ...d, depth: e.target.value }))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" placeholder="95" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button variant="outline" onClick={onBack}>Назад</Button>
                <Button size="lg" className="w-full" onClick={onSubmit}>Рассчитать</Button>
            </div>
        </div>
    </div>
);

const LoadingStep: React.FC<{ imagePreview: string }> = ({ imagePreview }) => (
    <div className="flex flex-col items-center text-center animate-subtle-fade-in">
        <div className="relative">
            <img src={imagePreview} alt="Анализ" className="rounded-lg shadow-md max-h-64 opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
        </div>
        <ArrowPathIcon className="w-12 h-12 text-brand-brown animate-spin my-6" />
        <h3 className="text-2xl font-serif text-brand-charcoal">ИИ-конструктор в работе...</h3>
        <p className="text-gray-600 mt-2">Анализируем фото, подбираем материалы и считаем смету. Это может занять до минуты.</p>
    </div>
);

const ResultsStep: React.FC<{ result: FurnitureBlueprint; imagePreview: string; onAddToCart: () => void; onReset: () => void; }> = ({ result, imagePreview, onAddToCart, onReset }) => (
    <div className="animate-subtle-fade-in">
        <h2 className="text-3xl font-serif text-brand-brown text-center mb-6">Ваше кастомное изделие готово!</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <img src={imagePreview} alt={result.furnitureName} className="rounded-lg shadow-md w-full" />
                <h3 className="text-xl font-semibold text-center mt-4">{result.furnitureName}</h3>
            </div>
            <div className="space-y-6">
                <div className="p-4 bg-brand-cream-dark/50 rounded-lg">
                    <h4 className="font-semibold text-lg text-brand-brown mb-2">План для производства</h4>
                    <h5 className="font-medium text-brand-charcoal mt-3">Расчетные размеры:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {result.blueprint.estimatedDimensions.map((dim, i) => <li key={i}>{dim}</li>)}
                    </ul>
                    <h5 className="font-medium text-brand-charcoal mt-3">Материалы:</h5>
                     <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {result.blueprint.materials.map((mat, i) => <li key={i}>{mat}</li>)}
                    </ul>
                </div>
                <div className="p-4 bg-brand-cream-dark/50 rounded-lg">
                     <h4 className="font-semibold text-lg text-brand-brown mb-2">Смета</h4>
                     <div className="space-y-2 text-brand-charcoal">
                        <div className="flex justify-between"><span>Материалы:</span> <span>{result.priceEstimate.materialsCost.toLocaleString('ru-RU')} ₽</span></div>
                        <div className="flex justify-between"><span>Работа:</span> <span>{result.priceEstimate.laborCost.toLocaleString('ru-RU')} ₽</span></div>
                        <hr className="my-1 border-brand-brown/20"/>
                        <div className="flex justify-between font-bold text-xl"><span className="font-serif">Итого:</span> <span className="font-serif">{result.priceEstimate.totalPrice.toLocaleString('ru-RU')} ₽</span></div>
                     </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <Button variant="outline" onClick={onReset}>Создать новое</Button>
                    <Button size="lg" className="w-full" onClick={onAddToCart}>Добавить в корзину</Button>
                </div>
            </div>
        </div>
    </div>
);