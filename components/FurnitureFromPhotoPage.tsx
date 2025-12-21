
import React, { useState } from 'react';
import { Button } from './Button';
import { ArrowLeftIcon, CubeTransparentIcon, CheckCircleIcon, ShareIcon, HeartIcon } from './icons';
import { ARViewer } from './ARViewer';
import { FurniturePreview } from './FurniturePreview'; // Import the newly created component
import { cn } from '../utils';

// Типы конфигурации
type FurnitureType = 'sofa' | 'armchair' | 'bed';
type SizeType = 'compact' | 'standard' | 'grand';
type StyleType = 'soft' | 'modern' | 'classic';

interface Configuration {
  type: FurnitureType;
  size: SizeType;
  style: StyleType;
}

// Данные для шагов (Контент)
const FURNITURE_TYPES = [
  { id: 'sofa', label: 'Диван' },
  { id: 'armchair', label: 'Кресло' },
  { id: 'bed', label: 'Кровать' },
];

const SIZES = [
  { id: 'compact', label: 'Компактный', desc: 'Для уютных студий' },
  { id: 'standard', label: 'Стандарт', desc: 'Для гостиной' },
  { id: 'grand', label: 'Просторный', desc: 'Для большой семьи' },
];

const STYLES = [
  { id: 'soft', label: 'Уютный', color: '#EBE5D9', desc: 'Текстиль, мягкие формы' },
  { id: 'modern', label: 'Модерн', color: '#7D7D7D', desc: 'Строгие линии, велюр' },
  { id: 'classic', label: 'Классика', color: '#59443B', desc: 'Детали, фактура' },
];

export const FurnitureFromPhotoPage = () => {
  // Состояния
  const [step, setStep] = useState<number>(0);
  const [config, setConfig] = useState<Configuration>({
    type: 'sofa',
    size: 'standard',
    style: 'soft',
  });
  const [isAROpen, setIsAROpen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Helper to get AR model URL based on config (Static Mapping for MVP)
  const getARModelUrl = (config: Configuration) => {
      // In a real app, this would point to specific files like /models/sofa_modern.glb
      // For MVP demo, we use a placeholder or a generic model if available
      return `/models/${config.type}_${config.style}.glb`; 
  };

  // Хендлеры
  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);
  
  const handleSelectType = (type: FurnitureType) => {
    setConfig(prev => ({ ...prev, type }));
    handleNext();
  };

  const handleSelectSize = (size: SizeType) => {
    setConfig(prev => ({ ...prev, size }));
    handleNext();
  };

  const handleSelectStyle = (style: StyleType) => {
    setConfig(prev => ({ ...prev, style }));
    // Не переходим автоматически, даем насладиться цветом
  };

  const startAR = () => {
    setIsAROpen(true);
  };

  const closeAR = () => {
    setIsAROpen(false);
    setIsFinished(true); // Показываем финальный экран
    setStep(4);
  };

  // --- ЭКРАН 0: ВХОД ---
  if (step === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-warm-white px-6 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-8 shadow-soft animate-fade-in-up">
           <CubeTransparentIcon className="w-10 h-10 text-brand-brown stroke-1" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-soft-black mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Создадим мебель<br />под вас
        </h1>
        <p className="text-muted-gray text-lg mb-12 max-w-md animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Выберите основу — мы поможем настроить остальное. Визуализация в реальном времени.
        </p>
        <Button size="lg" onClick={handleNext} className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          Начать создание
        </Button>
      </div>
    );
  }

  // --- AR РЕЖИМ ---
  if (isAROpen) {
    const currentModelUrl = getARModelUrl(config);
    
    return (
      <div className="fixed inset-0 z-[100] bg-black">
        <ARViewer 
            src={currentModelUrl} 
            alt="Custom Furniture"
            // В реальном проекте передаем сгенерированный конфиг или маппинг
        />
        <button 
            onClick={closeAR} 
            className="absolute top-6 left-6 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-soft z-20"
        >
            <ArrowLeftIcon className="w-6 h-6 text-soft-black" />
        </button>
      </div>
    );
  }

  // --- ФИНАЛ (ПОСЛЕ AR) ---
  if (isFinished) {
    return (
       <div className="min-h-[80vh] flex flex-col items-center justify-center bg-warm-white px-6 text-center animate-fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-soft max-w-md w-full border border-stone-beige/20">
             <div className="flex justify-center mb-6">
                 <CheckCircleIcon className="w-12 h-12 text-brand-brown" />
             </div>
             <h2 className="text-2xl font-serif text-soft-black mb-2">Ваш проект готов</h2>
             <p className="text-muted-gray text-sm mb-8">
                {FURNITURE_TYPES.find(t => t.id === config.type)?.label}, {SIZES.find(s => s.id === config.size)?.label}, {STYLES.find(s => s.id === config.style)?.label}
             </p>
             
             <div className="space-y-3">
                 <Button className="w-full bg-soft-black text-white">
                    Обсудить с дизайнером
                 </Button>
                 <Button variant="secondary" className="w-full" onClick={() => setIsFinished(false)}>
                    Изменить конфигурацию
                 </Button>
                 <div className="flex justify-center gap-6 pt-4">
                    <button className="flex items-center gap-2 text-sm text-muted-gray hover:text-soft-black">
                        <HeartIcon className="w-5 h-5" /> Сохранить
                    </button>
                    <button className="flex items-center gap-2 text-sm text-muted-gray hover:text-soft-black">
                        <ShareIcon className="w-5 h-5" /> Поделиться
                    </button>
                 </div>
             </div>
          </div>
       </div>
    );
  }

  // --- ВИЗУАЛИЗАЦИЯ И ШАГИ (1-3) ---
  return (
    <div className="min-h-screen bg-warm-white flex flex-col">
      {/* 3D Preview Area (Sticky Top) */}
      <div className="flex-grow relative bg-[#F0F0F0] h-[50vh] transition-all duration-500 overflow-hidden">
         
         {/* ИНТЕГРАЦИЯ: Живое 3D вместо иконки */}
         <div className="absolute inset-0">
             <FurniturePreview config={config} />
         </div>
         
         {/* Navigation Overlay */}
         <div className="absolute top-6 left-6 z-10">
             <button onClick={handleBack} className="bg-white/80 backdrop-blur p-2 rounded-full shadow-sm hover:bg-white transition-colors">
                 <ArrowLeftIcon className="w-5 h-5 text-soft-black" />
             </button>
         </div>
         <div className="absolute top-6 right-6 z-10">
             <span className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-soft-black">
                 Шаг {step} из 3
             </span>
         </div>
      </div>

      {/* Controls Area (Bottom Sheet) */}
      <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-8 min-h-[40vh] flex flex-col justify-between relative z-20 -mt-6">
        
        {/* Step 1: Type */}
        {step === 1 && (
            <div className="animate-fade-in">
                <h3 className="text-xl font-medium text-soft-black mb-6">Что будем создавать?</h3>
                <div className="grid grid-cols-3 gap-4">
                    {FURNITURE_TYPES.map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => handleSelectType(item.id as FurnitureType)}
                            className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 aspect-square",
                                config.type === item.id 
                                    ? "border-soft-black bg-warm-white" 
                                    : "border-stone-beige/30 hover:border-stone-beige"
                            )}
                        >
                            {/* Icon Placeholder */}
                            <div className="w-8 h-8 bg-stone-beige/20 rounded-full mb-3" />
                            <span className="text-sm font-medium text-soft-black">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Step 2: Size */}
        {step === 2 && (
            <div className="animate-fade-in">
                <h3 className="text-xl font-medium text-soft-black mb-6">Выберите размер</h3>
                <div className="space-y-3">
                    {SIZES.map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => handleSelectSize(item.id as SizeType)}
                            className={cn(
                                "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left",
                                config.size === item.id 
                                    ? "border-soft-black bg-warm-white" 
                                    : "border-stone-beige/30 hover:border-stone-beige"
                            )}
                        >
                            <span className="text-base font-medium text-soft-black">{item.label}</span>
                            <span className="text-xs text-muted-gray">{item.desc}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Step 3: Style & Finish */}
        {step === 3 && (
            <div className="animate-fade-in flex flex-col h-full">
                <div className="mb-8">
                    <h3 className="text-xl font-medium text-soft-black mb-6">Настроение и материал</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {STYLES.map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => handleSelectStyle(item.id as StyleType)}
                                className={cn(
                                    "flex flex-col items-center gap-3 p-2 rounded-xl transition-all",
                                    config.style === item.id ? "scale-105" : "opacity-70 hover:opacity-100"
                                )}
                            >
                                <div 
                                    className={cn(
                                        "w-16 h-16 rounded-full shadow-sm border-2",
                                        config.style === item.id ? "border-soft-black" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: item.color }} 
                                />
                                <span className="text-xs font-medium text-soft-black">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="mt-auto">
                    <Button size="lg" className="w-full shadow-lg" onClick={startAR}>
                        Посмотреть в интерьере
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
