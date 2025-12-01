
import React, { useState, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useToast } from '../contexts/ToastContext';
import { ArrowPathIcon, PhotoIcon } from '@heroicons/react/24/outline';

const STYLES = [
  { id: 'Modern', name: 'Современный', image: 'https://placehold.co/100x100/5D4037/FFF?text=Modern' },
  { id: 'Scandinavian', name: 'Скандинавский', image: 'https://placehold.co/100x100/5D4037/FFF?text=Scandi' },
  { id: 'Loft', name: 'Лофт', image: 'https://placehold.co/100x100/5D4037/FFF?text=Loft' },
  { id: 'Classic', name: 'Классика', image: 'https://placehold.co/100x100/5D4037/FFF?text=Classic' },
  { id: 'Minimalism', name: 'Минимализм', image: 'https://placehold.co/100x100/5D4037/FFF?text=Minimal' },
  { id: 'Boho', name: 'Бохо', image: 'https://placehold.co/100x100/5D4037/FFF?text=Boho' },
];

export default function AiRoomMakeover() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLES[0].id);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('Файл слишком большой (макс 5MB)', 'error');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setGeneratedImage(null);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      addToast('Пожалуйста, загрузите фото комнаты', 'error');
      return;
    }

    setLoading(true);
    try {
      const base64 = await convertToBase64(selectedFile);

      const res = await fetch('/api/ai/redesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          style: selectedStyle
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка генерации');
      }

      setGeneratedImage(data.generatedImage);
      addToast('Дизайн успешно создан!', 'success');
    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Не удалось создать дизайн', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>AI Редизайн | Labelcom Мебель</title>
        <meta name="description" content="Примерьте новый стиль для вашей комнаты с помощью ИИ" />
      </Head>
      <Header />
      <main className="flex-grow bg-[#FBF9F4] py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-serif text-brand-brown mb-4">AI Редизайн Интерьера</h1>
            <p className="text-brand-charcoal/70 text-lg max-w-2xl mx-auto">
              Загрузите фото своей комнаты, выберите стиль, и наш искусственный интеллект предложит вам новый взгляд на ваш интерьер.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Controls */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-brown/10">
              {/* Upload Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-brand-charcoal mb-4">1. Загрузите фото</h3>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${previewUrl ? 'border-brand-brown bg-brand-cream' : 'border-gray-300 hover:border-brand-brown/50 hover:bg-gray-50'}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {previewUrl ? (
                    <div className="relative aspect-video w-full h-48 mx-auto overflow-hidden rounded-lg">
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <PhotoIcon className="w-12 h-12 mb-2" />
                      <p>Нажмите, чтобы загрузить фото</p>
                      <p className="text-xs mt-1">JPG, PNG до 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Style Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-brand-charcoal mb-4">2. Выберите стиль</h3>
                <div className="grid grid-cols-3 gap-3">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-2 rounded-lg border text-sm transition-all ${
                        selectedStyle === style.id 
                          ? 'border-brand-brown bg-brand-brown text-white shadow-md' 
                          : 'border-gray-200 hover:border-brand-brown/50 text-gray-700 bg-white'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !selectedFile}
                className="w-full bg-brand-brown text-white py-4 rounded-xl font-semibold text-lg hover:bg-brand-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Творим магию...
                  </>
                ) : (
                  'Создать новый дизайн'
                )}
              </button>
            </div>

            {/* Right Column: Result */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-brown/10 min-h-[400px] flex flex-col">
              <h3 className="text-lg font-semibold text-brand-charcoal mb-4">Результат</h3>
              
              <div className="flex-grow flex items-center justify-center bg-[#F5F5F5] rounded-xl overflow-hidden relative">
                {loading ? (
                  <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-brown mx-auto mb-4"></div>
                    <p className="text-gray-500 animate-pulse">Анализируем вашу комнату...</p>
                    <p className="text-xs text-gray-400 mt-2">Это может занять 15-20 секунд</p>
                  </div>
                ) : generatedImage ? (
                  <div className="relative w-full h-full min-h-[300px]">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={generatedImage} 
                      alt="Generated Room" 
                      className="w-full h-auto rounded-lg shadow-inner"
                    />
                    <a 
                      href={generatedImage} 
                      download="my-new-room.png"
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-brand-brown px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-white transition-colors"
                    >
                      Скачать
                    </a>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 p-8">
                    <p>Здесь появится ваш новый интерьер</p>
                  </div>
                )}
              </div>
              
              {generatedImage && (
                <div className="mt-6 p-4 bg-brand-cream/50 rounded-lg border border-brand-brown/5">
                  <p className="text-sm text-brand-charcoal/80">
                    <strong>Совет дизайнера:</strong> Попробуйте найти похожую мебель в нашем <a href="/products" className="text-brand-brown hover:underline">каталоге</a>. 
                    ИИ показывает примерный образ, но мы поможем воплотить его в жизнь!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
