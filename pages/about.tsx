import React from 'react';
import Image from 'next/image';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import {
  SparklesIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '../components/Icons';

const addresses = [
  {
    city: 'Альметьевск',
    line: 'ул. Ленина, 85а',
    phone: '+7 (987) 216-70-75',
    hours: 'Пн–Сб 10:00–20:00, Вс 11:00–19:00',
  },
];

export default function About() {
  const openChat = (text: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openStylistChat', { detail: { text } }));
    }
  };

  return (
    <>
      <Header />
      <main className="bg-white text-brand-charcoal">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-cream to-white">
          <div className="container mx-auto px-6 py-16 text-center">
            <p className="inline-flex items-center px-4 py-2 rounded-full bg-white shadow-sm text-sm uppercase tracking-[0.2em] text-brand-brown">
              <SparklesIcon className="w-4 h-4 mr-2" /> since 2010
            </p>
            <h1 className="mt-6 text-4xl md:text-6xl font-serif font-bold leading-tight text-brand-charcoal">
              Labelcom — мебель со смыслом
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Мы создаем интерьеры, в которых премиальный дизайн встречается с продуманным комфортом. Каждый предмет — это statement о вкусе и статусе.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-16">
          <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="https://label-com.ru/images/virtuemart/product/Amazonka2.jpeg"
                alt="Гостиная Labelcom"
                fill
                className="object-cover"
                priority
              />
              <button
                type="button"
                onClick={() => openChat('Здравствуйте! Хочу подобрать комплект мебели и дизайн.')}
                className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/80 backdrop-blur-md p-4 flex items-center justify-between text-sm font-medium text-brand-charcoal shadow-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-brown/60 transition"
              >
                <span className="flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-brand-brown" /> AI-стилист поможет подобрать комплект
                </span>
                <span className="text-brand-brown font-semibold">24/7</span>
              </button>
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-2 rounded-full bg-brand-cream text-brand-brown text-xs font-semibold tracking-[0.2em] uppercase">
                Философия Labelcom
              </div>
              <h2 className="text-3xl md:text-4xl font-serif text-brand-charcoal">
                Роскошь, которая работает каждый день
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Мы начинали как бутик в Татарстане и выросли в бренд, который поставляет мебель для квартир, домов и шоурумов по всей России.
                В каждом изделии — благородные материалы, ручной декор и точная посадка, чтобы вещь выглядела дорого и служила долго.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {['Премиальные ткани и массив', 'Неоклассика, ар-деко, модерн', 'Контроль качества на фабрике', 'Доставка и сборка под ключ'].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-brand-brown mt-1" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Addresses */}
        <section className="py-14 bg-brand-cream/40">
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-3 mb-6">
              <SparklesIcon className="w-5 h-5 text-brand-brown" />
              <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">Где нас найти</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {addresses.map((address) => (
                <div
                  key={address.line}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-brand-cream hover:-translate-y-1 transition-all"
                >
                  <h3 className="text-xl font-serif mb-2">{address.city}</h3>
                  <div className="space-y-2 text-gray-700">
                    <p className="flex items-center gap-2"><MapPinIcon className="w-5 h-5 text-brand-brown" /> {address.line}</p>
                    <p className="flex items-center gap-2"><PhoneIcon className="w-5 h-5 text-brand-brown" /> <a href={`tel:${address.phone.replace(/\\s|\\(|\\)|-/g, '')}`} className="hover:text-brand-brown">{address.phone}</a></p>
                    <p className="text-sm text-gray-600">{address.hours}</p>
                  </div>
                </div>
              ))}
              <div className="bg-gradient-to-br from-brand-brown to-[#d6b48e] rounded-2xl p-6 text-white shadow-2xl">
                <h3 className="text-xl font-serif mb-2">Онлайн</h3>
                <p className="text-white/90 mb-3">Консультации в мессенджерах и быстрая доставка по России.</p>
                <div className="space-y-2 text-white">
                  <button
                    type="button"
                    onClick={() => openChat('Здравствуйте! Нужна консультация AI-стилиста.')}
                    className="flex items-center gap-2 hover:text-white/90 focus:outline-none"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" /> AI-консультант 24/7
                  </button>
                  <p className="flex items-center gap-2"><EnvelopeIcon className="w-5 h-5" /> <a href="mailto:hello@labelcom.store" className="underline underline-offset-4">hello@labelcom.store</a></p>
                  <p className="text-sm text-white/80">Отвечаем в течение 15 минут</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-white text-brand-charcoal py-16">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">Что важно</p>
                <h2 className="text-3xl md:text-4xl font-serif mt-2">Три опоры Labelcom</h2>
              </div>
              <p className="text-gray-600 max-w-xl">
                Мы отвечаем за впечатление от каждой комнаты: от тактильности ткани до того, как мебель вписывается в ваш образ жизни.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Качество', text: 'Массив, бархат, велюр, латунь. Мы контролируем производство и отбираем лучшие партии.' },
                { title: 'Стиль', text: 'Неоклассика, ар-деко и современные линии. Интерьеры, которые смотрятся премиально даже через годы.' },
                { title: 'Сервис', text: 'AI-подбор, личный менеджер, доставка и сборка под ключ. Забота на каждом шаге.' },
              ].map((item) => (
                <div key={item.title} className="p-8 rounded-2xl bg-brand-cream/40 border border-brand-cream shadow-lg hover:-translate-y-1 transition-transform">
                  <h3 className="text-xl font-bold text-brand-brown mb-3">{item.title}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
