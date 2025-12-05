'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import { Spinner } from '@/components/Spinner';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/types';
import { useRouter } from 'next/router';
import { 
  PhotoIcon, 
  SparklesIcon, 
} from '@/components/Icons'; 

// Опции стилей
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
  
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [redesignedImage, setRedesignedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Modern');
  
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
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
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
        toast.error('Пожалуйста, загрузите изображение (JPG, PNG).');
        return;
    }
    try {
        const resized = await resizeImage(file);
        setOriginalImage(resized);
        setRedesignedImage(null);
        setRecommendedProducts([]);
    } catch (error) {
        console.error("Ошибка обработки:", error);
        toast.error("Не удалось обработать изображение");
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

    const toastId = toast.loading('Разрабатываем концепцию вашего нового интерьера...');

    try {
      const response = await fetch('/api/ai/redesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: originalImage, prompt, style }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || `Ошибка: ${response.status}`);
      if (data.error) throw new Error(data.error);
      if (!data.redesigned) throw new Error("Сервер не вернул изображение.");

      setRedesignedImage(data.redesigned);
      toast.success('Проект готов! Наслаждайтесь результатом.', { id: toastId });

      setIsProductsLoading(true);
      try {
        const productsRes = await fetch(`/api/products/recommendations?style=${style}`);
        const productsData = await productsRes.json();
        if (productsData.products && productsData.products.length > 0) {
            setRecommendedProducts(productsData.products);
            toast.success(`Подобрано ${productsData.products.length} эксклюзивных товаров!`, { icon: '✨' });
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

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-20"> 
      
      <div className="relative bg-brand-brown text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern-bg.png')] mix-blend-overlay"></div> 
        <div className="container mx-auto px-4 relative z-10 text-center">
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
                                accept="image/*" 
                                className="hidden"
                                onChange={handleImageUpload} 
                            />
                            
                            {originalImage ? (
                                <div className="absolute inset-2 overflow-hidden rounded-lg">
                                    <img src={originalImage} alt="Uploaded" className="w-full h-full object-cover" />
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
                                className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-300 flex items-center justify-center
                                    ${isLoading || !originalImage 
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                        : 'bg-brand-brown text-white hover:bg-brand-charcoal hover:scale-[1.02] hover:shadow-xl'}`}
                            >
                                {isLoading ? (
                                    <>
                                        <Spinner className="w-6 h-6 mr-3 text-white" />
                                        <span>Создаем ваш дизайн-проект...</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-6 h-6 mr-2" />
                                        <span>Преобразить комнату</span>
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
                             
                             <div className="absolute top-4 right-4 z-10">
                                <a 
                                    href={redesignedImage} 
                                    download="labelcom-design.png" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center bg-white/90 backdrop-blur text-brand-charcoal px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:bg-white transition-all"
                                >
                                    {/* Убрал иконку ArrowDownTrayIcon, заменил на текст, чтобы не было ошибок импорта */}
                                    Скачать
                                </a>
                             </div>
                        </div>
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
