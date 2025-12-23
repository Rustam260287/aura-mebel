
import React, { useState, useCallback } from 'react';
import { Button } from './Button';
import { PhotoIcon, SparklesIcon, HeartIcon, ArrowDownIcon } from './icons';
import BeforeAfterSlider from './BeforeAfterSlider';
import { useToast } from '../contexts/ToastContext';
import { useRouter } from 'next/router';

// This component now implements the 5-stack architecture for AI Redesign.
export const AIRoomMakeoverPage: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [redesignedImageUrl, setRedesignedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wish, setWish] = useState('');
  const { addToast } = useToast();
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setOriginalImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImageUrl(reader.result as string);
        setRedesignedImageUrl(null); // Reset result on new image
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
        
        // Redesign Stack: Call the API
        const response = await fetch('/api/ai/redesign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, prompt: wish || 'a calm, modern, premium interior with neutral and warm palette' }),
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
  }, [originalImage, wish, addToast]);
  
  const handleReset = () => {
      setOriginalImage(null);
      setOriginalImageUrl(null);
      setRedesignedImageUrl(null);
      setWish('');
  }

  // Experience Stack actions
  const handleFindSimilar = () => {
      // This would ideally use the EXTRACTION STACK data to filter the catalog.
      // For now, it just navigates to the catalog.
      addToast('Перенаправляем в галерею похожих объектов...', 'info');
      router.push('/products');
  };

  const handleSaveIdea = () => {
      // In a real app, this would save the redesigned image to the user's "Подборка"
      addToast('Идея сохранена в вашу подборку!', 'success');
  };

  return (
    <div className="bg-warm-white min-h-screen py-12 md:py-20">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-medium text-soft-black mb-4">AI редизайн комнаты</h1>
            <p className="text-muted-gray leading-relaxed">
                Загрузите фотографию вашего интерьера, и наш AI предложит, как его можно преобразить с помощью мебели Labelcom.
            </p>
        </div>

        {/* Main Content */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-soft border border-stone-beige/20">
            {!redesignedImageUrl ? (
                // INPUT STACK
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
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

                    <div className="flex flex-col gap-4">
                        <textarea
                            value={wish}
                            onChange={(e) => setWish(e.target.value)}
                            placeholder="Опционально: ваши пожелания (например, 'уютная гостиная в светлых тонах')"
                            className="w-full p-4 bg-warm-white/80 border border-stone-beige/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-beige placeholder:text-muted-gray/70"
                            rows={3}
                        />
                        <Button size="lg" onClick={handleRedesign} disabled={!originalImage || isLoading} className="w-full h-14">
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Преображаем...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5 mr-2" />
                                    Начать редизайн
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                // REDESIGN STACK (Result) & EXPERIENCE STACK (Actions)
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
