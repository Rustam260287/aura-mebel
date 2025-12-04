
import React, { useState, useCallback, ChangeEvent } from 'react';
import { SparklesIcon, PhotoIcon, ArrowUpOnSquareIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { useToast } from '../contexts/ToastContext';
import { BeforeAfterSlider } from './BeforeAfterSlider'; // Импортируем новый компонент

export const AIRoomMakeoverPage = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('Неоклассика');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const { addToast } = useToast();

  const styles = ['Современный', 'Минимализм', 'Неоклассика', 'Лофт'];

  const handleImageUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImage(e.target.result as string);
          setResultImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedImage) {
      addToast('Пожалуйста, загрузите изображение вашей комнаты.', 'error');
      return;
    }
    setIsLoading(true);
    setResultImage(null);

    try {
      const response = await fetch('/api/ai/redesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: selectedImage, style: selectedStyle }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Произошла ошибка при генерации изображения.');
      }

      const data = await response.json();
      setResultImage(data.redesignedImageUrl);
      addToast('Ваш новый интерьер готов!', 'success');

    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedImage, selectedStyle, addToast]);

  return (
    <div className="bg-[#FBF9F4] py-12 md:py-20">
      <div className="container mx-auto px-4">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
            <SparklesIcon className="w-16 h-16 text-brand-brown mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-serif text-brand-brown mb-4">AI Редизайн Комнаты</h1>
            <p className="text-lg text-brand-charcoal/70 leading-relaxed">
                Загрузите фото вашей комнаты, выберите стиль, и наш ИИ создаст фотореалистичный редизайн вашего интерьера.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-brown/10 sticky top-24">
            <h2 className="text-2xl font-serif text-brand-charcoal mb-6">1. Загрузите фото</h2>
            <div 
              className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-brand-brown transition-colors"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input id="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
              {selectedImage ? (
                <img src={selectedImage} alt="Превью комнаты" className="w-full h-auto max-h-64 object-contain rounded-md" />
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <PhotoIcon className="w-12 h-12 mb-2" />
                  <span className="font-medium">Нажмите, чтобы загрузить</span>
                  <span className="text-sm">PNG, JPG, WEBP до 10MB</span>
                </div>
              )}
            </div>

            <h2 className="text-2xl font-serif text-brand-charcoal mt-8 mb-6">2. Выберите стиль</h2>
            <div className="grid grid-cols-2 gap-4">
              {styles.map(style => (
                <button 
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-4 py-3 rounded-lg text-center font-medium transition-all duration-200 border-2 ${selectedStyle === style ? 'bg-brand-brown text-white border-brand-brown shadow-md' : 'bg-white hover:bg-brand-cream border-transparent'}`}
                >
                  {style}
                </button>
              ))}
            </div>

            <Button size="lg" onClick={handleSubmit} disabled={isLoading || !selectedImage} className="w-full mt-10 shadow-lg hover:shadow-xl transition-shadow">
              {isLoading ? <Spinner /> : <><SparklesIcon className="w-5 h-5 mr-2" />Сгенерировать редизайн</>}
            </Button>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-brown/10 min-h-[500px] flex items-center justify-center">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Spinner size="lg" />
                <p className="mt-4 text-brand-charcoal/70 font-medium">Создаем ваш новый интерьер...<br/>Это может занять до минуты.</p>
              </div>
            )}
            
            {resultImage && !isLoading && selectedImage && (
              <div className="w-full animate-fade-in">
                 <h2 className="text-2xl font-serif text-brand-brown mb-4 text-center">Ваш редизайн в стиле "{selectedStyle}"</h2>
                 <BeforeAfterSlider before={selectedImage} after={resultImage} />
              </div>
            )}
            
            {!isLoading && !resultImage && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <SparklesIcon className="w-16 h-16 mb-4" />
                <p className="font-medium">Здесь появится ваш новый интерьер</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
