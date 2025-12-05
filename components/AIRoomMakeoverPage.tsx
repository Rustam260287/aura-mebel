'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import { Spinner } from '@/components/Spinner';

const styleOptions = [
  "Modern", "Minimalist", "Industrial", "Scandinavian", 
  "Bohemian", "Farmhouse", "Coastal", "Art Deco"
];

const AIRoomMakeoverPage: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [redesignedImage, setRedesignedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Modern');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setRedesignedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalImage) {
      toast.error('Пожалуйста, загрузите изображение комнаты.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Наш ИИ творит магию... Это может занять до минуты.');

    try {
      const response = await fetch('/api/ai/redesign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl: originalImage,
          prompt,
          style
        }),
      });

      const data = await response.json();
      toast.dismiss(toastId);

      if (!response.ok) {
        // Теперь мы ожидаем, что data.error будет содержать осмысленное сообщение
        throw new Error(data.error || `Ошибка: ${response.statusText}`);
      }

      if (data.error) {
        // На случай, если сервер вернет 200 OK, но с полем error
        throw new Error(data.error);
      }

      setRedesignedImage(data.redesigned);
      toast.success('Ваша комната преображена!');

    } catch (error) {
      toast.dismiss(toastId);
      console.error('AI Redesign Error:', error);
      // Отображаем ошибку в toast, чтобы пользователь ее увидел
      toast.error(error instanceof Error ? error.message : 'Произошла непредвиденная ошибка.');
    }

    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">AI Редизайн комнаты</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Загрузите фотографию вашей комнаты, и наш искусственный интеллект предложит новый дизайн за считанные секунды!</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-lg p-8 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-2">1. Загрузите фото</label>
              <input 
                id="image-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
              {originalImage && (
                <div className="mt-4 border rounded-lg p-2">
                  <img src={originalImage} alt="Original room" className="w-full h-auto rounded-md" />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="style-select" className="block text-sm font-medium text-gray-700 mb-2">2. Выберите стиль</label>
              <select 
                id="style-select"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {styleOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>
              <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-700 mt-4 mb-2">3. (Опционально) Опишите ваши пожелания</label>
              <textarea 
                id="prompt-input"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Например: 'добавь больше растений и естественного света'"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
              />
            </div>
          </div>
          <div className="mt-8 text-center">
            <button type="submit" disabled={isLoading || !originalImage} className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
              {isLoading ? <Spinner /> : 'Преобразить комнату'}
            </button>
          </div>
        </form>

        {isLoading && (
          <div className="text-center p-8">
            <p className="text-gray-600">Идет генерация... это может занять до минуты.</p>
          </div>
        )}

        {!isLoading && redesignedImage && originalImage && (
          <div>
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Результат</h2>
            <BeforeAfterSlider before={originalImage} after={redesignedImage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRoomMakeoverPage;
