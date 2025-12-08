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
import { SEO } from '../components/SEO';

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
      <SEO
        title="О Labelcom"
        description="Labelcom — мебель со смыслом. Премиальные материалы, продуманный комфорт и сервис с AI-стилистом."
      />
      <Header />
      <main className="bg-brand-cream text-brand-charcoal">
        {/* Hero */}
        <section className="py-14">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr,0.95fr] gap-8 bg-white/80 backdrop-blur rounded-3xl border border-brand-cream shadow-premium overflow-hidden">
              <div className="p-10 md:p-12 space-y-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-brand-cream text-brand-terracotta text-xs font-semibold tracking-[0.25em] uppercase">
                  Since 2010
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight text-brand-brown">
                  Labelcom — мебель со смыслом
                </h1>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Мы создаем интерьеры, в которых премиальный дизайн встречается с продуманным комфортом. Каждый предмет — это statement о вкусе и статусе.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {['Премиальные ткани и массив', 'Неоклассика, ар-деко, модерн', 'Контроль качества на фабрике', 'Доставка и сборка под ключ'].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircleIcon className="w-5 h-5 text-brand-brown mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openChat('Здравствуйте! Хочу подобрать комплект мебели и дизайн.')}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-brown text-white px-5 py-3 text-sm font-semibold shadow-premium-hover transition hover:-translate-y-0.5"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" /> AI-стилист 24/7
                  </button>
                  <div className="flex items-center gap-2 text-sm text-brand-charcoal/80">
                    <SparklesIcon className="w-5 h-5 text-brand-terracotta" />
                    Индивидуальный подбор под ваш интерьер
                  </div>
                </div>
              </div>
              <div className="relative min-h-[360px]">
                <Image
                  src="https://label-com.ru/images/virtuemart/product/Amazonka2.jpeg"
                  alt="Гостиная Labelcom"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-brand-cream/85 backdrop-blur p-4 shadow-premium text-sm text-brand-charcoal">
                  <div className="flex items-center gap-2 font-semibold">
                    <SparklesIcon className="w-4 h-4 text-brand-terracotta" /> Атмосфера салона у вас дома
                  </div>
                  <p className="mt-1 text-brand-charcoal/80">Так выглядят реальные интерьеры с мебелью Labelcom.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr,0.9fr] gap-10 items-start">
              <div className="bg-white rounded-3xl border border-brand-cream shadow-premium p-8 md:p-10 space-y-4">
                <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">Философия Labelcom</p>
                <h2 className="text-3xl md:text-4xl font-serif text-brand-brown">Роскошь, которая работает каждый день</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Мы начинали как бутик в Татарстане и выросли в бренд, который поставляет мебель для квартир, домов и шоурумов по всей России.
                  В каждом изделии — благородные материалы, ручной декор и точная посадка, чтобы вещь выглядела дорого и служила долго.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Материалы', text: 'Массив, бархат, велюр, латунь. Отборные ткани и фурнитура.' },
                    { title: 'Стиль', text: 'Неоклассика, ар-деко и современная геометрия без лишнего шума.' },
                    { title: 'Контроль', text: 'Следим за производством и обивкой на фабрике, чтобы вы получали лучшее.' },
                    { title: 'Сервис', text: 'AI-подбор, доставка и сборка под ключ — заботимся с первого касания.' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl bg-brand-cream/60 border border-brand-cream p-4">
                      <h3 className="text-base font-semibold text-brand-brown mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-brand-cream shadow-premium p-8 md:p-10 space-y-6">
                <div className="flex items-center gap-3">
                  <SparklesIcon className="w-5 h-5 text-brand-terracotta" />
                  <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">Сервис</p>
                </div>
                <div className="space-y-4 text-gray-700">
                  <p>
                    Подбираем комплекты под ваш стиль и задачи: от уютных квартир до камерных шоурумов. Помогаем с цветами, фактурами и габаритами, чтобы мебель вписалась идеально.
                  </p>
                  <p>
                    Упаковываем, доставляем и собираем под ключ. Менеджер на связи на каждом этапе, а AI-стилист подскажет идеи в любое время.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openChat('Здравствуйте! Хочу консультацию по дизайну интерьера и мебели.')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-brand-brown/30 bg-brand-cream px-5 py-3 text-sm font-semibold text-brand-brown hover:border-brand-brown hover:-translate-y-0.5 transition shadow-premium-hover"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" /> Открыть чат с AI-стилистом
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Addresses */}
        <section className="py-14">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <SparklesIcon className="w-5 h-5 text-brand-brown" />
                  <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">Где нас найти</p>
                </div>
                <p className="text-gray-700 max-w-2xl">
                  Приходите в салон, чтобы увидеть материалы и посадку диванов вживую. Или пишите онлайн — покажем детали в фото и видео.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {addresses.map((address) => (
                  <div
                    key={address.line}
                    className="bg-white rounded-2xl p-6 shadow-premium border border-brand-cream hover:-translate-y-1 transition-all"
                  >
                    <h3 className="text-xl font-serif text-brand-brown mb-2">{address.city}</h3>
                    <div className="space-y-2 text-gray-700">
                      <p className="flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-brand-brown" /> {address.line}
                      </p>
                      <p className="flex items-center gap-2">
                        <PhoneIcon className="w-5 h-5 text-brand-brown" />{' '}
                        <a href={`tel:${address.phone.replace(/\s|\(|\)|-/g, '')}`} className="hover:text-brand-brown">
                          {address.phone}
                        </a>
                      </p>
                      <p className="text-sm text-gray-600">{address.hours}</p>
                    </div>
                  </div>
                ))}
                <div className="bg-brand-brown text-white rounded-2xl p-6 shadow-premium hover:-translate-y-1 transition">
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
                    <p className="flex items-center gap-2">
                      <EnvelopeIcon className="w-5 h-5" />{' '}
                      <a href="mailto:hello@labelcom.store" className="underline underline-offset-4">
                        hello@labelcom.store
                      </a>
                    </p>
                    <p className="text-sm text-white/80">Отвечаем в течение 15 минут</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">Что важно</p>
                  <h2 className="text-3xl md:text-4xl font-serif mt-2 text-brand-brown">Три опоры Labelcom</h2>
                </div>
                <p className="text-gray-700 max-w-xl">
                  Мы отвечаем за впечатление от каждой комнаты: от тактильности ткани до того, как мебель вписывается в ваш образ жизни.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: 'Качество', text: 'Массив, бархат, велюр, латунь. Мы контролируем производство и отбираем лучшие партии.' },
                  { title: 'Стиль', text: 'Неоклассика, ар-деко и современные линии. Интерьеры, которые смотрятся премиально даже через годы.' },
                  { title: 'Сервис', text: 'AI-подбор, личный менеджер, доставка и сборка под ключ. Забота на каждом шаге.' },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-8 rounded-2xl bg-white border border-brand-cream shadow-premium hover:-translate-y-1 transition-transform"
                  >
                    <h3 className="text-xl font-bold text-brand-brown mb-3">{item.title}</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
