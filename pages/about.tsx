
import React, { memo } from 'react';
import Image from 'next/image';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Meta } from '../components/Meta';

const AboutPage: React.FC = memo(() => {
  return (
    <>
      <Meta
        title="О нас — Labelcom"
        description="Мы создаем мебель, которую можно сначала увидеть у себя дома. И только потом — решить, подходит ли она вам."
      />
      <Header />
      <main className="bg-warm-white">
        
        {/* 1. Первый экран */}
        <div className="container mx-auto px-6 py-24 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-medium text-soft-black mb-6 leading-tight tracking-tight animate-fade-in">
            Пространство для<br/>вашего решения
          </h1>
          <p className="text-lg text-muted-gray max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Мы создаем мебель, которую можно сначала увидеть у себя дома.
            И только потом — решить, подходит ли она вам.
          </p>
        </div>

        {/* 2. Философия */}
        <div className="container mx-auto px-6 pb-24 md:pb-32">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-xl font-medium text-soft-black mb-3">Мы не торопим</h3>
                    <p className="text-muted-gray leading-relaxed">
                        Принятие решения требует времени. Мы создали все условия для спокойного выбора.
                    </p>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h3 className="text-xl font-medium text-soft-black mb-3">Мы показываем</h3>
                    <p className="text-muted-gray leading-relaxed">
                        Визуальный опыт в вашем интерьере честнее любых слов и убеждений.
                    </p>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <h3 className="text-xl font-medium text-soft-black mb-3">Опыт важнее</h3>
                    <p className="text-muted-gray leading-relaxed">
                        Мы ценим ваше ощущение от объекта больше, чем его технические характеристики.
                    </p>
                </div>
            </div>
        </div>

        {/* Атмосферный визуал (опционально) */}
        <div className="h-64 md:h-96 bg-stone-beige/10 overflow-hidden relative">
            <Image 
                src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                alt="Материалы"
                fill
                className="object-cover opacity-30"
            />
        </div>

        {/* 3. Как мы работаем */}
        <div className="bg-white">
            <div className="container mx-auto px-6 py-24 md:py-32 text-center max-w-3xl">
                <h2 className="text-3xl md:text-4xl font-medium text-soft-black mb-12">Как это работает</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left relative">
                    {/* Линия-соединитель */}
                    <div className="absolute top-1/2 left-0 w-full h-px bg-stone-beige/30 hidden md:block" />

                    <div className="relative p-6">
                        <span className="absolute -top-3 left-6 text-5xl font-serif text-stone-beige/40">1</span>
                        <h4 className="font-medium text-soft-black mb-2 mt-8">Выберите объект</h4>
                        <p className="text-sm text-muted-gray">Найдите в галерее то, что вам нравится визуально.</p>
                    </div>
                     <div className="relative p-6">
                        <span className="absolute -top-3 left-6 text-5xl font-serif text-stone-beige/40">2</span>
                        <h4 className="font-medium text-soft-black mb-2 mt-8">Посмотрите в комнате</h4>
                        <p className="text-sm text-muted-gray">Используйте AR, чтобы увидеть, как он вписывается.</p>
                    </div>
                     <div className="relative p-6">
                        <span className="absolute -top-3 left-6 text-5xl font-serif text-stone-beige/40">3</span>
                        <h4 className="font-medium text-soft-black mb-2 mt-8">Примите решение</h4>
                        <p className="text-sm text-muted-gray">Сохраните, обсудите с менеджером и вернитесь к решению позже. Без спешки.</p>
                    </div>
                </div>
            </div>
        </div>

      </main>
      <Footer />
    </>
  );
});

AboutPage.displayName = 'AboutPage';

export default AboutPage;
