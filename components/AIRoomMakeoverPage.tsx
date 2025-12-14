
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import { Spinner } from '@/components/Spinner';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/Button'; 
import type { Product } from '@/types';
import { useRouter } from 'next/router';
import { 
  PhotoIcon, 
  SparklesIcon, 
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  XMarkIcon
} from '@/components/Icons'; 
import Image from 'next/image';

const styleOptions = [
  { value: "Modern", label: "Современный" },
  { value: "Minimalist", label: "Минимализм" },
  { value: "Classic", label: "Классика" },
  { value: "Industrial", label: "Лофт" },
  { value: "Scandinavian", label: "Скандинавский" },
  { value: "Bohemian", label: "Бохо" },
  { value: "Art Deco", label: "Арт-деко" },
  { value: "Coastal", label: "Морской" }
];

const AIRoomMakeoverPage: React.FC = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createImageElement = (): HTMLImageElement =>
    document.createElement('img');
  
  const [mounted, setMounted] = useState(false);
  
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [redesignedImage, setRedesignedImage] = useState<string | null>(null);
  const [shareableUrl, setShareableUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Modern');
  
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const previewObjectUrlRef = useRef<string | null>(null);

  const revokePreviewUrl = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      revokePreviewUrl();
    };
  }, []);

  const [tryOnFurniture, setTryOnFurniture] = useState<{name: string, image: string} | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const { furnitureName, furnitureImage } = router.query;
    if (furnitureName && typeof furnitureName === 'string') {
        setTryOnFurniture({
            name: furnitureName,
            image: typeof furnitureImage === 'string' ? furnitureImage : ''
        });
        toast.success(`Режим примерки: ${furnitureName}`, { icon: '🛋️' });
    }
  }, [router.isReady, router.query]);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawData = event.target?.result;
        if (typeof rawData !== 'string') {
          reject(new Error('Не удалось прочитать файл'));
          return;
        }
        const img = createImageElement();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
        img.src = rawData;
      };
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsDataURL(file);
    });
  };

  // --- SMART COMPOSITE LOGIC ---
  // Создаем коллаж: комната + мебель
  const createCompositeImage = async (roomUrl: string, furnitureUrl: string): Promise<string> => {
      return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
              reject(new Error("Canvas context not available"));
              return;
          }

          const roomImg = createImageElement();
          roomImg.crossOrigin = "Anonymous";
          
          roomImg.onload = () => {
              canvas.width = roomImg.width;
              canvas.height = roomImg.height;
              
              // 1. Рисуем комнату
              ctx.drawImage(roomImg, 0, 0);

              const furnitureImg = createImageElement();
              furnitureImg.crossOrigin = "Anonymous";
              
              furnitureImg.onload = () => {
                  // 2. Рассчитываем размер и позицию мебели
                  // Мебель занимает ~60% ширины
                  const scaleFactor = 0.6; 
                  const furnWidth = canvas.width * scaleFactor;
                  const furnHeight = furnitureImg.height * (furnWidth / furnitureImg.width);
                  
                  // Позиция: по центру горизонтально
                  const x = (canvas.width - furnWidth) / 2;
                  
                  // Ставим мебель "на пол" (примерно 8% от низа, чтобы не висела и не обрезалась)
                  const y = canvas.height - furnHeight - (canvas.height * 0.08); 

                  // 3. Рисуем мебель
                  ctx.drawImage(furnitureImg, x, y, furnWidth, furnHeight);
                  
                  resolve(canvas.toDataURL('image/jpeg', 0.95));
              };
              
              furnitureImg.onerror = (e) => {
                  console.warn("Furniture load error", e);
                  resolve(roomUrl); // Fallback: без мебели
              };
              
              // Используем прокси, чтобы избежать CORS
              furnitureImg.src = `/api/proxy-image?url=${encodeURIComponent(furnitureUrl)}`;
          };
          
          roomImg.onerror = reject;
          roomImg.src = roomUrl;
      });
  };

  const processFile = async (file: File) => {
    const supportedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const fileType = file.type || '';
    const isSupported =
      supportedMimeTypes.has(fileType) ||
      /\.(jpe?g|png|webp)$/i.test(file.name || '');

    if (!isSupported) {
        toast.error('Поддерживаются JPG/PNG/WebP. Форматы HEIC/HEIF часто не поддерживаются — сохраните фото как JPG.');
        return;
    }
    let previewUrl: string | null = null;
    try {
        previewUrl = URL.createObjectURL(file);
        previewObjectUrlRef.current = previewUrl;
        setOriginalImage(previewUrl);
        setRedesignedImage(null);
        setRecommendedProducts([]);
        setShareableUrl(null);

        const resized = await resizeImage(file);
        setOriginalImage(resized);
        if (previewUrl) revokePreviewUrl();
    } catch (error) {
        console.error("Ошибка обработки:", error);
        toast.error("Не удалось оптимизировать фото — использую оригинал.");
        // Если успели показать превью (blob URL) — оставляем его, чтобы пользователь видел картинку.
        // Если превью не было — очищаем.
        if (!previewUrl) {
          revokePreviewUrl();
          setOriginalImage(null);
        }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const uploadImageForSharing = async (image: string): Promise<string | null> => {
    setIsUploading(true);
    try {
        const response = await fetch('/api/ai/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Upload failed');
        setShareableUrl(data.url);
        return data.url;
    } catch (error) {
        toast.error('Не удалось загрузить изображение для шеринга.');
        return null;
    } finally {
        setIsUploading(false);
    }
  };

  const handleDiscussWithStylist = async () => {
    if (!redesignedImage) return;

    let url = shareableUrl;
    if (!url) {
        url = await uploadImageForSharing(redesignedImage);
    }

    if (url) {
        const text = tryOnFurniture 
            ? `Я примерил мебель "${tryOnFurniture.name}" в этом интерьере (стиль ${style}). Как вам результат?`
            : `Здравствуйте! Мне понравился этот дизайн (стиль: ${style}). Можете найти такую мебель в вашем каталоге или предложить изготовление на заказ?`;

        const event = new CustomEvent('startChatWithImage', {
            detail: { imageUrl: url, text }
        });
        window.dispatchEvent(event);
        toast.success('Чат с экспертом открыт!', { icon: '💬' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalImage) {
      toast.error('Пожалуйста, загрузите изображение комнаты.');
      return;
    }

    setIsLoading(true);
    setRedesignedImage(null); 
    setRecommendedProducts([]);
    
    setTimeout(() => {
        const resultSection = document.getElementById('result-section');
        if (resultSection) resultSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    const toastId = toast.loading('Обработка...');

    try {
      let finalImageUrl = originalImage;
      let finalPrompt = prompt;
      let isComposite = false;

      // Если есть мебель, создаем коллаж
      if (tryOnFurniture && tryOnFurniture.image) {
          try {
              toast.loading('Вставляем мебель...', { id: toastId });
              finalImageUrl = await createCompositeImage(originalImage, tryOnFurniture.image);
              isComposite = true;
              
              // Для режима примерки мы НЕ указываем стиль жестко, если он не был выбран
              // Мы говорим нейросети: "сделай эту композицию реальной"
              // Флаг isComposite для API - сигнал использовать Flux в режиме Refiner
          } catch (err) {
              console.error("Composite failed", err);
          }
      }

      const response = await fetch('/api/ai/redesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            imageUrl: finalImageUrl, 
            prompt: finalPrompt, 
            style,
            isComposite // Ключевой флаг
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || `Ошибка: ${response.status}`);
      if (data.error) throw new Error(data.error);
      if (!data.redesigned) throw new Error("Сервер не вернул изображение.");

      setRedesignedImage(data.redesigned);
      toast.success('Готово! Оцените результат.', { id: toastId });

      setIsProductsLoading(true);
      try {
        const productsRes = await fetch(`/api/products/recommendations?style=${style}`);
        const productsData = await productsRes.json();
        if (productsData.products && productsData.products.length > 0) {
            setRecommendedProducts(productsData.products);
        }
      } catch (prodError) {
        console.error("Ошибка загрузки товаров:", prodError);
      } finally {
        setIsProductsLoading(false);
      }

    } catch (error) {
      console.error('AI Redesign Error:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка генерации.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const clearTryOn = () => {
      setTryOnFurniture(null);
      setPrompt('');
      router.replace('/ai-room-makeover', undefined, { shallow: true });
  };

  if (!mounted) return null;

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-20"> 
      
      <div className="relative bg-brand-brown text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern-bg.png')] mix-blend-overlay"></div> 
        <div className="container mx-auto px-4 relative z-10 pt-16 md:pt-20">
            <button 
                onClick={() => router.push('/')}
                className="absolute top-4 left-4 md:top-6 md:left-10 flex items-center text-white/70 hover:text-white transition-colors group z-20 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 border border-white/20"
            >
                <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                На главную
            </button>

            <div className="text-center mt-2 md:mt-4">
                <div className="inline-flex items-center justify-center p-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
                    <SparklesIcon className="w-5 h-5 text-yellow-300 mr-2" />
                    <span className="text-sm font-medium tracking-wide uppercase">Premium Interior AI</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight">
                    Создайте интерьер мечты <br className="hidden md:block" /> одним кликом
                </h1>
                <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
                    Загрузите фото вашей комнаты, выберите стиль, и наш искусственный интеллект мгновенно предложит профессиональный дизайн-проект с мебелью Labelcom.
                </p>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            
            <form onSubmit={handleSubmit} className="p-8 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    <div className="lg:col-span-5 flex flex-col">
                        <label className="block text-sm font-bold text-brand-charcoal uppercase tracking-wider mb-4 flex items-center">
                            <span className="bg-brand-brown text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                            Загрузите фото
                        </label>
                        
                        <div 
                            className={`flex-grow min-h-[300px] border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative group bg-gray-50
                                ${isDragOver ? 'border-brand-brown bg-brand-brown/5' : 'border-gray-300 hover:border-brand-brown/50 hover:bg-gray-100'}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleImageUpload} 
                            />
                            
                            {originalImage ? (
                                <div className="absolute inset-2 overflow-hidden rounded-lg relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={originalImage}
                                      alt="Uploaded"
                                      className="w-full h-full object-cover"
                                    />
                                    {/* ПРЕВЬЮ: Показываем пользователю, как мебель "сядет" (чтобы он понимал, что будет в коллаже) */}
                                    {tryOnFurniture && tryOnFurniture.image && (
                                        <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] z-10 pointer-events-none opacity-80">
                                            <div className="w-full h-full relative">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                  src={tryOnFurniture.image}
                                                  alt="Furniture Preview"
                                                  className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-white font-medium flex items-center bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                                            <PhotoIcon className="w-5 h-5 mr-2" /> Заменить фото
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-6">
                                    <div className="w-16 h-16 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-4 text-brand-brown">
                                        <PhotoIcon className="w-8 h-8" />
                                    </div>
                                    <p className="text-brand-charcoal font-medium text-lg mb-1">Нажмите или перетащите фото</p>
                                    <p className="text-gray-400 text-sm">Поддерживаются JPG, PNG</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col justify-between">
                        <div>
                            {/* Блок активной примерки */}
                            {tryOnFurniture && (
                                <div className="mb-6 bg-brand-cream/30 border border-brand-brown/20 rounded-xl p-4 flex items-center animate-fade-in-up">
                                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 mr-3 relative">
                                        {tryOnFurniture.image ? (
                                            <Image
                                                src={tryOnFurniture.image}
                                                alt={tryOnFurniture.name}
                                                className="object-cover"
                                                fill
                                                sizes="48px"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">Нет фото</div>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-xs text-brand-brown font-bold uppercase tracking-wider">Режим примерки (Коллаж)</p>
                                        <p className="text-sm font-medium text-brand-charcoal line-clamp-1">{tryOnFurniture.name}</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={clearTryOn}
                                        className="p-1.5 hover:bg-black/5 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                        title="Отменить примерку"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            <div className="mb-8">
                                <label className="block text-sm font-bold text-brand-charcoal uppercase tracking-wider mb-4 flex items-center">
                                    <span className="bg-brand-brown text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                                    Выберите стиль
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {styleOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setStyle(opt.value)}
                                            className={`p-3 rounded-lg text-sm font-medium border transition-all duration-200 text-center
                                                ${style === opt.value 
                                                    ? 'border-brand-brown bg-brand-brown text-white shadow-md' 
                                                    : 'border-gray-200 text-gray-600 hover:border-brand-brown/50 hover:bg-gray-50'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-bold text-brand-charcoal uppercase tracking-wider mb-4 flex items-center">
                                    <span className="bg-brand-brown text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">3</span>
                                    Пожелания (опционально)
                                </label>
                                <textarea 
                                    rows={3}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Например: 'добавь больше света, поставь бежевый диван, убери ковер'..."
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown transition-all text-brand-charcoal placeholder-gray-400 resize-none"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                             <button 
                                type="submit" 
                                disabled={isLoading || !originalImage} 
                                className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-300 flex items-center justify-center overflow-hidden relative group
                                    ${isLoading || !originalImage 
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                        : 'bg-brand-brown text-white hover:bg-brand-charcoal hover:scale-[1.02] hover:shadow-xl'}`}
                            >
                                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"></div>
                                
                                {isLoading ? (
                                    <>
                                        <Spinner className="w-6 h-6 mr-3 text-white" />
                                        <span className="relative z-20">Обработка...</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-6 h-6 mr-2 relative z-20" />
                                        <span className="relative z-20">Преобразить комнату</span>
                                    </>
                                )}
                            </button>
                            {!originalImage && <p className="text-center text-gray-400 text-sm mt-3">Загрузите фото, чтобы начать</p>}
                        </div>
                    </div>
                </div>
            </form>
        </div>
      </div>

      <div id="result-section" className="container mx-auto px-4 mt-16 scroll-mt-24">
        {redesignedImage && originalImage && (
            <div className="animate-fade-in-up space-y-16">
                
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <span className="text-brand-brown font-medium tracking-widest text-sm uppercase mb-2 block">Результат трансформации</span>
                        <h2 className="text-3xl md:text-5xl font-serif text-brand-charcoal">Ваш новый интерьер</h2>
                    </div>
                    
                    <div className="bg-white p-2 rounded-2xl shadow-2xl border border-gray-100">
                        <div className="rounded-xl overflow-hidden relative">
                             <BeforeAfterSlider before={originalImage} after={redesignedImage} />
                        </div>
                    </div>

                    <div className="mt-8 text-center flex justify-center">
                        <button
                            onClick={handleDiscussWithStylist}
                            disabled={isUploading}
                            className="group relative inline-flex items-center justify-center px-8 py-4 font-serif text-lg text-white transition-all duration-300 bg-gradient-to-r from-brand-brown to-[#7D5A50] rounded-full hover:scale-105 hover:shadow-2xl hover:shadow-brand-brown/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-brown disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                        >
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            
                            <div className="relative mr-3 p-1 bg-white/20 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                                <SparklesIcon className="w-6 h-6 animate-pulse" />
                            </div>
                            
                            <span className="relative font-medium tracking-wide">
                                {isUploading ? 'Подготовка...' : 'Обсудить с AI-Ассистентом'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto">
                     <div className="flex flex-col items-center mb-12">
                         <div className="h-px w-24 bg-brand-brown/30 mb-6"></div>
                         <h3 className="text-2xl md:text-4xl font-serif text-brand-charcoal text-center mb-4">
                            Воплотите этот стиль в реальность
                         </h3>
                         <p className="text-gray-500 text-center max-w-2xl">
                             Мы подобрали мебель из коллекции Labelcom, которая идеально впишется в ваш новый дизайн.
                         </p>
                     </div>

                    {isProductsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                             {[1,2,3,4].map(i => (
                                 <div key={i} className="bg-white rounded-xl h-96 animate-pulse">
                                     <div className="bg-gray-200 h-64 rounded-t-xl"></div>
                                     <div className="p-4 space-y-3">
                                         <div className="h-4 bg-gray-200 w-3/4 rounded"></div>
                                         <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    ) : recommendedProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {recommendedProducts.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    onProductSelect={(id) => router.push(`/products/${id}`)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-xl border border-gray-100 shadow-sm">
                             <p className="text-gray-400">Нет подходящих товаров для этого стиля. Попробуйте посмотреть весь каталог.</p>
                             <button onClick={() => router.push('/products')} className="mt-4 text-brand-brown font-bold hover:underline">Перейти в каталог</button>
                        </div>
                    )}
                </div>

            </div>
        )}
      </div>
    </div>
  );
};

export default AIRoomMakeoverPage;
