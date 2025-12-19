
import React, { memo } from 'react';
import Image from 'next/image';
import { Button } from './Button';
import { useRouter } from 'next/router';

export const About: React.FC = memo(() => {
    const router = useRouter();
  return (
    <div className="bg-white">
        {/* Hero Section */}
        <div className="relative py-24 md:py-32 bg-brand-cream overflow-hidden">
             <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-terracotta/5 skew-x-12 translate-x-1/4" />
             <div className="container mx-auto px-6 relative z-10 text-center">
                 <h1 className="text-5xl md:text-7xl font-serif text-brand-charcoal mb-8 animate-fade-in-up">
                    История <span className="text-brand-terracotta italic">Labelcom</span>
                 </h1>
                 <p className="text-xl text-brand-charcoal/70 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    Мы не просто создаем мебель. Мы проектируем атмосферу, в которой разворачиваются самые важные моменты вашей жизни.
                 </p>
             </div>
        </div>

      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden shadow-2xl shadow-brand-brown/10 transform md:rotate-2 hover:rotate-0 transition-transform duration-700">
                <Image 
                    src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                    alt="Мастерская Labelcom"
                    fill
                    className="object-cover"
                />
            </div>
            <div>
                 <span className="text-brand-terracotta text-sm font-bold uppercase tracking-widest mb-4 block">Наша философия</span>
                <h2 className="text-4xl font-serif text-brand-charcoal mb-6">Дизайн с душой</h2>
                <div className="space-y-6 text-lg text-brand-charcoal/80 font-light leading-relaxed">
                    <p>
                        Labelcom зародился из простой идеи: красота должна быть функциональной, а комфорт — бескомпромиссным. Мы отвергаем "быструю моду" в интерьере в пользу вещей, которые стареют красиво.
                    </p>
                    <p>
                        Каждый предмет в нашей коллекции проходит строгий отбор. Мы ищем баланс между современной эстетикой и традиционным мастерством. Натуральное дерево, тактильные ткани, честные материалы — это наш язык дизайна.
                    </p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="bg-brand-cream/50 p-8 rounded-lg text-center hover:bg-brand-cream transition-colors duration-300">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-brand-terracotta">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-3">Качество</h3>
                <p className="text-brand-charcoal/70 font-light">Мы используем только проверенные материалы и сотрудничаем с лучшими мануфактурами.</p>
            </div>
            <div className="bg-brand-cream/50 p-8 rounded-lg text-center hover:bg-brand-cream transition-colors duration-300">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-brand-terracotta">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-3">Долговечность</h3>
                <p className="text-brand-charcoal/70 font-light">Мебель, созданная служить годами, сохраняя свой первозданный вид и актуальность.</p>
            </div>
            <div className="bg-brand-cream/50 p-8 rounded-lg text-center hover:bg-brand-cream transition-colors duration-300">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-brand-terracotta">
                     <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-3">С любовью</h3>
                <p className="text-brand-charcoal/70 font-light">Мы любим то, что делаем, и хотим, чтобы вы почувствовали эту заботу в каждой детали.</p>
            </div>
        </div>
        
        <div className="text-center bg-brand-charcoal text-white rounded-2xl p-12 md:p-20 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                 <Image src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="bg" fill className="object-cover" />
             </div>
             <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-serif mb-6">Готовы преобразить свой дом?</h2>
                <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 font-light">
                    Посмотрите наш каталог и найдите то, что идеально дополнит ваш интерьер.
                </p>
                <Button size="lg" className="bg-white text-brand-charcoal hover:bg-brand-terracotta hover:text-white border-none" onClick={() => router.push('/products')}>
                    Перейти в каталог
                </Button>
             </div>
        </div>
      </div>
    </div>
  );
});

About.displayName = 'About';
