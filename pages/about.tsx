
import React from 'react';
import Image from 'next/image';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import {
  SparklesIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  HeartIcon
} from '../components/Icons';
import { SEO } from '../components/SEO';

export default function About() {
  const openChat = (text: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openStylistChat', { detail: { text } }));
    }
  };

  return (
    <>
      <SEO
        title="О Labelcom"
        description="Labelcom — мебель со смыслом. Премиальные материалы, продуманный комфорт и сервис с AI-стилистом."
      />
      <Header />
      <main className="bg-[#FAF9F6] min-h-screen pb-20">
        
        {/* Hero Section */}
        <div className="bg-brand-brown text-white py-16 md:py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="container mx-auto px-6 relative z-10 text-center">
                <div className="inline-flex items-center justify-center p-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
                    <StarIcon className="w-4 h-4 text-yellow-300 mr-2" />
                    <span className="text-xs font-bold tracking-widest uppercase">Since 2010</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight">
                    Мебель со смыслом
                </h1>
                <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
                    Мы создаем интерьеры, в которых премиальный дизайн встречается с продуманным комфортом. Каждый предмет — это заявление о вкусе и статусе.
                </p>
            </div>
        </div>

        {/* Content Container */}
        <div className="container mx-auto px-4 md:px-6 -mt-10 relative z-20 space-y-24">
            
            {/* Story Block */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 grid lg:grid-cols-2">
                <div className="relative min-h-[400px] lg:min-h-full order-2 lg:order-1">
                    <Image
                        src="https://label-com.ru/images/virtuemart/product/Amazonka2.jpeg"
                        alt="Интерьер Labelcom"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>
                <div className="p-8 md:p-12 flex flex-col justify-center order-1 lg:order-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Наша Философия</p>
                    <h2 className="text-3xl md:text-4xl font-serif text-brand-charcoal mb-6">Роскошь на каждый день</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Мы начинали как бутик в Татарстане и выросли в бренд, который поставляет мебель для квартир, домов и шоурумов по всей России.
                        В каждом изделии — благородные материалы, ручной декор и точная посадка.
                    </p>
                    <ul className="space-y-4 mb-8">
                        {[
                            'Массив, бархат, велюр, латунь',
                            'Неоклассика, ар-деко и модерн',
                            'Строгий контроль качества'
                        ].map(item => (
                            <li key={item} className="flex items-center text-brand-charcoal font-medium">
                                <CheckCircleIcon className="w-5 h-5 text-brand-brown mr-3" />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={() => openChat('Здравствуйте! Расскажите подробнее о бренде.')}
                        className="self-start px-8 py-3 bg-brand-brown text-white rounded-xl font-bold hover:bg-brand-charcoal transition-colors shadow-lg shadow-brand-brown/20"
                    >
                        Связаться с нами
                    </button>
                </div>
            </div>

            {/* Values Grid */}
            <div className="text-center max-w-4xl mx-auto">
                <h2 className="text-3xl font-serif text-brand-charcoal mb-12">Три опоры Labelcom</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-6 text-brand-brown">
                            <CheckCircleIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-brand-charcoal mb-3">Качество</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Контролируем каждый шов и стык. Используем только отборные материалы, которые служат годами.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-6 text-brand-brown">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-brand-charcoal mb-3">Стиль</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Актуальный дизайн, который не устаревает. Интерьеры, которые выглядят как с обложки журнала.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-6 text-brand-brown">
                            <HeartIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-brand-charcoal mb-3">Сервис</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            AI-подбор, личный менеджер, доставка и сборка под ключ. Забота на каждом этапе.
                        </p>
                    </div>
                </div>
            </div>

            {/* AI Call to Action */}
            <div className="bg-brand-charcoal text-white rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-brown/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-brown/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 max-w-2xl mx-auto">
                    <SparklesIcon className="w-10 h-10 text-yellow-300 mx-auto mb-6" />
                    <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Создайте свой идеальный интерьер</h2>
                    <p className="text-white/80 text-lg mb-8">
                        Не знаете, с чего начать? Наш AI-стилист проанализирует ваши предпочтения и предложит лучшие решения из каталога.
                    </p>
                    <button
                        onClick={() => openChat('Помогите подобрать мебель под мой стиль.')}
                        className="px-8 py-4 bg-white text-brand-charcoal rounded-xl font-bold hover:bg-brand-cream transition-colors"
                    >
                        <ChatBubbleLeftRightIcon className="w-5 h-5 inline-block mr-2" />
                        Начать подбор
                    </button>
                </div>
            </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
