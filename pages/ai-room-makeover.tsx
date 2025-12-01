
import React, { useState, useRef } from 'react';
import Head from 'next/head';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useToast } from '../contexts/ToastContext';
import { ArrowPathIcon, PhotoIcon, SparklesIcon, CheckCircleIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

const STYLES = [
  { id: 'Modern', name: 'Modern Luxury' },
  { id: 'Loft', name: 'Industrial Loft' },
  { id: 'Classic', name: 'Royal Classic' },
  { id: 'Minimalism', name: 'Zen Minimalism' },
  { id: 'Boho', name: 'Boho Chic' },
  { id: 'Scandinavian', name: 'Nordic Premium' },
];

interface SuggestedItem {
    category: string;
    reason: string;
}

interface AnalysisResult {
  analysis: string;
  vision: string;
  tips: string[];
  palette: string[];
  suggested_furniture: SuggestedItem[];
}

export default function AiRoomMakeover() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLES[0].id);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        addToast('Файл слишком большой (макс 10MB)', 'error');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult(null);
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
      addToast('Загрузите фото вашего интерьера', 'error');
      return;
    }

    setLoading(true);
    setResult(null);
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
        throw new Error(data.message || 'Ошибка анализа');
      }

      if (data.isConsultation && data.data) {
          setResult(data.data);
      } else {
         throw new Error("Некорректный ответ от AI");
      }

      addToast('Ваш персональный план готов!', 'success');
    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Не удалось связаться с AI-консультантом', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>AI Premium Consultant | Labelcom</title>
        <meta name="description" content="Ваш персональный гид в мир стиля и дизайна" />
      </Head>
      <Header />
      <main className="flex-grow bg-[#FBF9F4] py-12 min-h-screen">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12 animate-fade-in-up">
            <span className="text-brand-brown text-sm font-bold tracking-[0.2em] uppercase mb-2 block">Labelcom AI Exclusive</span>
            <h1 className="text-4xl md:text-5xl font-serif text-brand-charcoal mb-4">Персональный Дизайн-Консультант</h1>
            <p className="text-brand-charcoal/60 text-lg max-w-2xl mx-auto font-light">
              Загрузите фото комнаты, и наш ИИ создаст для вас стратегию преображения пространства в стиле высокой моды.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Input */}
            <div className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-premium border border-brand-brown/5 sticky top-24">
              <div className="mb-8">
                <h3 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider mb-4">1. Ваше пространство</h3>
                <div 
                  onClick={() => !loading && fileInputRef.current?.click()}
                  className={`group relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed transition-all cursor-pointer ${previewUrl ? 'border-brand-brown/20' : 'border-brand-brown/10 hover:border-brand-brown/30 bg-brand-cream/30'}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={loading}
                  />
                  {previewUrl ? (
                    <>
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="bg-white/90 backdrop-blur text-brand-charcoal px-4 py-2 rounded-full text-sm font-medium">Изменить фото</span>
                        </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-brand-charcoal/40 group-hover:text-brand-brown transition-colors">
                      <PhotoIcon className="w-12 h-12 mb-3" />
                      <span className="font-medium">Нажмите для загрузки</span>
                      <span className="text-xs mt-1 opacity-60">JPG, PNG до 10MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-brand-charcoal uppercase tracking-wider mb-4">2. Желаемая эстетика</h3>
                <div className="grid grid-cols-2 gap-3">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      disabled={loading}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between ${
                        selectedStyle === style.id 
                          ? 'bg-brand-brown text-white shadow-lg shadow-brand-brown/20' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {style.name}
                      {selectedStyle === style.id && <CheckCircleIcon className="w-5 h-5" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !selectedFile}
                className="w-full bg-brand-charcoal text-white py-4 rounded-xl font-bold tracking-wide hover:bg-brand-brown transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Анализирую стиль...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    Получить проект
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Result */}
            <div className="lg:col-span-7 space-y-6">
              {loading ? (
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-brand-brown/5 text-center min-h-[400px] flex flex-col items-center justify-center animate-pulse">
                  <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center mb-6">
                    <SparklesIcon className="w-10 h-10 text-brand-brown animate-spin-slow" />
                  </div>
                  <h3 className="text-2xl font-serif text-brand-charcoal mb-2">ИИ создает магию...</h3>
                  <p className="text-gray-500 max-w-md">Мы изучаем геометрию вашей комнаты, подбираем идеальную палитру и ищем лучшие предметы из коллекции Labelcom.</p>
                </div>
              ) : result ? (
                <div className="animate-slide-in-left space-y-6">
                  
                  {/* Vision Card */}
                  <div className="bg-white p-8 rounded-3xl shadow-premium border-l-4 border-brand-brown overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <SparklesIcon className="w-32 h-32" />
                    </div>
                    <span className="text-brand-brown font-bold tracking-widest text-xs uppercase mb-2 block">Концепция</span>
                    <h2 className="text-3xl font-serif text-brand-charcoal mb-4">Ваш новый интерьер</h2>
                    <p className="text-lg text-gray-600 italic mb-6 leading-relaxed">
                        &quot;{result.vision}&quot;
                    </p>
                    <div className="bg-brand-cream/50 p-4 rounded-xl">
                        <h4 className="font-bold text-brand-charcoal mb-2 text-sm uppercase">Анализ эксперта:</h4>
                        <p className="text-sm text-gray-700">{result.analysis}</p>
                    </div>
                  </div>

                  {/* Tips & Palette */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-serif text-xl text-brand-charcoal mb-4">Ключевые шаги</h3>
                        <ul className="space-y-4">
                            {result.tips.map((tip, idx) => (
                                <li key={idx} className="flex gap-3 items-start">
                                    <span className="flex-shrink-0 w-6 h-6 bg-brand-brown text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{idx + 1}</span>
                                    <span className="text-gray-700 text-sm">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
                        <h3 className="font-serif text-xl text-brand-charcoal mb-4 text-center">Палитра настроения</h3>
                        <div className="flex justify-center gap-3">
                            {result.palette.map((color, idx) => (
                                <div key={idx} className="group relative">
                                    <div 
                                        className="w-12 h-24 rounded-full shadow-md transition-transform group-hover:-translate-y-2 border border-gray-100"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black text-white px-2 py-1 rounded">
                                        {color}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>

                  {/* Product Recommendations */}
                  <div className="bg-brand-charcoal text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="font-serif text-2xl mb-6 flex items-center gap-3">
                            <ShoppingBagIcon className="w-8 h-8 text-brand-gold" />
                            Выбор стилиста Labelcom
                        </h3>
                        <div className="grid gap-4">
                            {result.suggested_furniture.map((item, idx) => (
                                <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/20 transition-colors flex justify-between items-center group cursor-pointer"
                                     onClick={() => router.push(`/products?search=${encodeURIComponent(item.category)}`)}>
                                    <div>
                                        <h4 className="font-bold text-lg text-brand-gold mb-1">{item.category}</h4>
                                        <p className="text-sm text-gray-300 group-hover:text-white transition-colors">{item.reason}</p>
                                    </div>
                                    <div className="bg-white text-brand-charcoal p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                                        <ArrowPathIcon className="w-5 h-5 -rotate-90" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => router.push('/products')}
                            className="mt-8 w-full bg-brand-gold text-brand-charcoal font-bold py-3 rounded-xl hover:bg-white transition-colors shadow-lg shadow-brand-gold/20"
                        >
                            Перейти в каталог
                        </button>
                    </div>
                    {/* Decorative background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-brown rounded-full blur-[100px] opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                  </div>

                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 text-brand-charcoal/30 border-2 border-dashed border-brand-charcoal/5 rounded-3xl min-h-[400px]">
                  <SparklesIcon className="w-24 h-24 mb-6 opacity-20" />
                  <h3 className="text-xl font-medium mb-2">Пространство для идей</h3>
                  <p className="max-w-sm">Здесь появится ваша персональная карта стиля и рекомендации по покупкам.</p>
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
