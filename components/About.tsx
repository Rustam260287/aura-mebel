
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
                        История <span className="text-brand-terracotta italic">AURA</span>
                    </h1>
                    <p className="text-xl text-brand-charcoal/70 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Мы не просто предлагаем мебель. Мы помогаем увидеть, как она изменит ваше пространство.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
                    <div className="relative aspect-[4/5] rounded-lg overflow-hidden flex items-center justify-center transform md:rotate-2 hover:rotate-0 transition-transform duration-700 bg-stone-beige/10">
                        <div className="w-1/2 h-1/2 rounded-full bg-stone-beige/20 blur-3xl"></div>
                    </div>
                    <div>
                        <span className="text-brand-terracotta text-sm font-bold uppercase tracking-widest mb-4 block">Наша философия</span>
                        <h2 className="text-4xl font-serif text-brand-charcoal mb-6">Дизайн с душой</h2>
                        <div className="space-y-6 text-lg text-brand-charcoal/80 font-light leading-relaxed">
                            <p>
                                AURA зародилась из простой идеи: выбор мебели должен быть спокойным. Мы верим, что лучше один раз увидеть предмет в своем интерьере, чем тысячу раз представить.
                            </p>
                            <p>
                                Каждый объект в нашей галерее отобран с вниманием к деталям. Мы ищем баланс между современной эстетикой и ощущением дома.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    <div className="bg-brand-cream/50 p-8 rounded-lg text-center hover:bg-brand-cream transition-colors duration-300">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-brand-terracotta">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        </div>
                        <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-3">Качество</h3>
                        <p className="text-brand-charcoal/70 font-light">Мы используем только проверенные материалы и сотрудничаем с лучшими мануфактурами.</p>
                    </div>
                    <div className="bg-brand-cream/50 p-8 rounded-lg text-center hover:bg-brand-cream transition-colors duration-300">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-brand-terracotta">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-3">Долговечность</h3>
                        <p className="text-brand-charcoal/70 font-light">Мебель, созданная служить годами, сохраняя свой первозданный вид и актуальность.</p>
                    </div>
                    <div className="bg-brand-cream/50 p-8 rounded-lg text-center hover:bg-brand-cream transition-colors duration-300">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-brand-terracotta">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-3">С любовью</h3>
                        <p className="text-brand-charcoal/70 font-light">Мы любим то, что делаем, и хотим, чтобы вы почувствовали эту заботу в каждой детали.</p>
                    </div>
                </div>

                <div className="text-center bg-brand-charcoal text-white rounded-2xl p-12 md:p-20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute inset-0 bg-white/10" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-serif mb-6">Хотите примерить объект в комнате?</h2>
                        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 font-light">
                            Откройте галерею, посмотрите в 3D и примерьте в AR — спокойно, без спешки.
                        </p>
                        <Button size="lg" className="bg-white text-brand-charcoal hover:bg-brand-terracotta hover:text-white border-none" onClick={() => router.push('/objects')}>
                            Открыть галерею
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
});

About.displayName = 'About';
