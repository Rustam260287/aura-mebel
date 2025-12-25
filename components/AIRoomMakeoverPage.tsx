
import React, { useState, useCallback } from 'react';
import { Button } from './Button';
import { PhotoIcon, SparklesIcon, HeartIcon } from './icons';
import BeforeAfterSlider from './BeforeAfterSlider';
import { useToast } from '../contexts/ToastContext';
import { useRouter } from 'next/router';
import { cn } from '../utils';

const STYLES = [
  { id: 'Soft', name: 'Soft', description: 'Мягкая, спокойная атмосфера. Округлая мебель, тактильные ткани, тёплые нейтральные оттенки.' },
  { id: 'Modern', name: 'Modern', description: 'Чистые линии и сбалансированные формы. Современная мебель, нейтральная палитра.' },
  { id: 'Minimal', name: 'Minimal', description: 'Максимум воздуха и простоты. Лаконичные формы, светлые оттенки.' },
  { id: 'Cozy', name: 'Cozy', description: 'Тёплая, жилая атмосфера. Комфортная мебель, мягкий свет.' },
  { id: 'Classic', name: 'Classic', description: 'Сдержанная элегантность и вне времени. Пропорциональная мебель, спокойные цвета.' },
  { id: 'Modern Soft', name: 'Modern Soft', description: 'Современный стиль с мягким характером. Баланс эстетики и уюта.' },
  { id: 'Calm Neutral', name: 'Calm Neutral', description: 'Нейтральная, спокойная среда. Светлые природные оттенки.' },
];

export const AIRoomMakeoverPage: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [redesignedImageUrl, setRedesignedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wish, setWish] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const { addToast } = useToast();
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setOriginalImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImageUrl(reader.result as string);
        setRedesignedImageUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRedesign = useCallback(async () => {
    if (!originalImage) return;
    setIsLoading(true);
    setRedesignedImageUrl(null);

    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(originalImage);
    });

    try {
        const base64Image = await base64Promise;
        
        const response = await fetch('/api/ai/redesign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, prompt: wish, style: selectedStyle }),
        });

        if (!response.ok) {
            throw new Error('Не удалось обработать изображение. Попробуйте другое фото.');
        }

        const data = await response.json();
        setRedesignedImageUrl(data.imageUrl);

    } catch (error) {
        console.error(error);
        addToast(error instanceof Error ? error.message : 'Произошла ошибка', 'error');
    } finally {
        setIsLoading(false);
    }
  }, [originalImage, wish, selectedStyle, addToast]);
  
  const handleReset = () => {
      setOriginalImage(null);
      setOriginalImageUrl(null);
      setRedesignedImageUrl(null);
      setWish('');
      setSelectedStyle(STYLES[0].id);
  }

  const handleFindSimilar = () => {
      addToast('Перенаправляем в галерею похожих объектов...', 'info');
      router.push('/products');
  };

  const handleSaveIdea = () => {
      addToast('Идея сохранена в вашу подборку!', 'success');
  };

  return (
    <div className="bg-warm-white min-h-screen py-12 md:py-20">
      <div className="container mx-auto px-6">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-medium text-soft-black mb-4">AI редизайн комнаты</h1>
            <p className="text-muted-gray leading-relaxed">
                Загрузите фотографию вашего интерьера, и наш AI предложит, как его можно преобразить с помощью мебели Labelcom.
            </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-soft border border-stone-beige/20">
            {!redesignedImageUrl ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="flex flex-col items-center justify-center">
                        <label className="w-full aspect-video border-2 border-dashed border-stone-beige/50 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-warm-white/50 transition-colors group">
                            {originalImageUrl ? (
                                <img src={originalImageUrl} alt="Preview" className="max-h-full w-auto object-contain rounded-lg shadow-sm" />
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-warm-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <PhotoIcon className="w-8 h-8 text-muted-gray" />
                                    </div>
                                    <span className="font-medium text-soft-black">Загрузите фото комнаты</span>
                                    <span className="text-xs text-muted-gray mt-1">PNG, JPG до 10MB</span>
                                </>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                        {originalImageUrl && <button onClick={handleReset} className="text-xs text-muted-gray mt-3 hover:text-soft-black">Загрузить другое фото</button>}
                    </div>

                    <div className="flex flex-col gap-6">
                        <div>
                            <h3 className="text-lg font-medium text-soft-black mb-4">Выберите стиль</h3>
                            <div className="flex flex-wrap gap-2">
                                {STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => setSelectedStyle(style.id)}
                                        className={cn(
                                            'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border',
                                            selectedStyle === style.id
                                                ? 'bg-soft-black text-white border-soft-black'
                                                : 'bg-white text-muted-gray border-stone-beige/30 hover:border-soft-black hover:text-soft-black'
                                        )}
                                    >
                                        {style.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <textarea
                            value={wish}
                            onChange={(e) => setWish(e.target.value)}
                            placeholder="Опционально: ваши пожелания..."
                            className="w-full p-4 bg-warm-white/80 border border-stone-beige/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-beige placeholder:text-muted-gray/70"
                            rows={2}
                        />

                        <Button size="lg" onClick={handleRedesign} disabled={!originalImage || isLoading} className="w-full h-14">
                            {isLoading ? 'Преображаем...' : <><SparklesIcon className="w-5 h-5 mr-2" />Начать редизайн</>}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <BeforeAfterSlider before={originalImageUrl!} after={redesignedImageUrl} />
                    
                    <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
                        <Button variant="primary" size="lg" onClick={handleFindSimilar}>
                            Посмотреть похожую мебель
                        </Button>
                        <Button variant="secondary" size="lg" onClick={handleSaveIdea}>
                           <HeartIcon className="w-5 h-5 mr-2" /> Сохранить идею
                        </Button>
                        <Button variant="text" onClick={handleReset}>
                            Попробовать снова
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
