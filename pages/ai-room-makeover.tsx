
import React from 'react';
import Head from 'next/head';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function AiRoomMakeover() {
  return (
    <>
      <Head>
        <title>AI Редизайн | Labelcom Мебель</title>
        <meta name="description" content="AI Редизайн интерьера скоро появится" />
      </Head>
      <Header />
      <main className="flex-grow bg-[#FBF9F4] flex items-center justify-center min-h-[60vh]">
        <div className="container mx-auto px-4 text-center">
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-brand-brown/10 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-6">
                    <SparklesIcon className="w-10 h-10 text-brand-brown" />
                </div>
                <h1 className="text-4xl font-serif text-brand-brown mb-4">AI Редизайн комнаты</h1>
                <p className="text-lg text-brand-charcoal/70 mb-8 leading-relaxed">
                    Мы готовим что-то особенное! Совсем скоро наш ИИ поможет вам преобразить ваш интерьер за считанные секунды.
                    <br/>
                    Эта функция сейчас находится в активной разработке.
                </p>
                <div className="inline-block bg-brand-brown/10 text-brand-brown px-6 py-2 rounded-full font-medium text-sm">
                    Следите за обновлениями
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
