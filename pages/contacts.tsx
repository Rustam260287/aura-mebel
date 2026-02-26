
import React, { memo } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Meta } from '../components/Meta';
import { Button } from '../components/Button';
import { WhatsAppIcon, TelegramIcon, ChatBubbleLeftRightIcon } from '../components/icons';
import { trackJourneyEvent } from '../lib/journey/client';
import { useExperience } from '../contexts/ExperienceContext';

const addresses = [
  {
    city: 'Альметьевск',
    line: 'ул. Ленина, 85А',
    hours: 'Пн–Сб: 10:00–20:00, Вс: 11:00–19:00',
    coordinates: 'https://yandex.ru/map-widget/v1/?ll=52.298522%2C54.901576&mode=search&ol=geo&ouri=ymapsbm1%3A%2F%2Fgeo%3Fdata%3DCgg1NzQ1MzAzORJG0KDQvtGB0YHQuNGPLCDQoNC10YHQv9GD0LHQu9C40LrQsCDQotCw0YLQsNGA0YHRgtCw0L0sINCQ0LvRjNC80LXRgtGM0LXQstGB0LosINGD0LvQuNGG0LAg0JvQtdC90LjQvdCwLCA4NUEiCg2hQlFCFcRyUUI%2C&z=17.09'
  },
];

const ContactsPage: React.FC = memo(() => {
  // No useExperience needed for contacts unless tracking visits, 
  // but "openChat" is explicitly FORBIDDEN here.

  return (
    <>
      <Meta
        title="Контакты — Aura"
        description="Мы на связи, когда вам удобно. Выберите подходящий способ — мы ответим без спешки."
      />
      <Header />
      <main className="bg-warm-white min-h-screen">
        <div className="container mx-auto px-6 py-12 md:py-20">

          {/* 1. Заголовок */}
          <div className="text-left max-w-2xl mb-16 md:mb-24">
            <h1 className="text-4xl md:text-5xl font-medium text-soft-black mb-6 tracking-tight">
              Контакты
            </h1>
            <p className="text-lg text-muted-gray leading-relaxed font-light">
              Мы на связи, когда вам удобно. Выберите подходящий способ — мы ответим без спешки.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

            {/* 2. Основная информация */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {addresses.map((addr) => (
                  <div key={addr.city} className="space-y-4">
                    <h3 className="text-xl font-medium text-soft-black">{addr.city}</h3>
                    <div className="space-y-1 text-sm text-muted-gray font-light">
                      <p>{addr.line}</p>
                      <p>{addr.hours}</p>
                    </div>
                  </div>
                ))}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-soft-black">Связь</h3>
                  <div className="space-y-1 text-sm text-muted-gray font-light">
                    <a href="mailto:daniyagizatulina005@gmail.com" className="block hover:text-soft-black transition-colors underline decoration-transparent hover:decoration-soft-black underline-offset-4">
                      daniyagizatulina005@gmail.com
                    </a>
                    <p className="cursor-default">+7 (987) 216-70-75</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Способы связи (Quiet Buttons) */}
            <div className="lg:col-span-5">
              <div className="bg-white p-8 rounded-2xl shadow-soft border border-stone-beige/10">
                <h3 className="text-lg font-medium text-soft-black mb-6">Написать нам</h3>
                <div className="space-y-3">
                  <a href="https://wa.me/79872167075" target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button variant="outline" className="w-full justify-start h-14 rounded-xl border-stone-beige/30 hover:border-stone-beige/60 grayscale hover:grayscale-0 transition-all">
                      <WhatsAppIcon className="w-5 h-5 mr-3 text-[#25D366]" /> WhatsApp
                    </Button>
                  </a>
                  <a href="https://t.me/+79872167075" target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button variant="outline" className="w-full justify-start h-14 rounded-xl border-stone-beige/30 hover:border-stone-beige/60 grayscale hover:grayscale-0 transition-all">
                      <TelegramIcon className="w-5 h-5 mr-3 text-[#0088cc]" /> Telegram
                    </Button>
                  </a>
                  <a href="tel:+79872167075" className="block w-full">
                    <Button variant="outline" className="w-full justify-start h-14 rounded-xl border-stone-beige/30 hover:border-stone-beige/60 grayscale hover:grayscale-0 transition-all">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3 text-brand-charcoal" /> MAX
                    </Button>
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* 4. Карта Альметьевска */}
          <div className="mt-24 h-[450px] bg-stone-beige/5 rounded-2xl overflow-hidden shadow-soft border border-stone-beige/10 relative group">
            <iframe
              src={addresses[0].coordinates}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              title="Яндекс Карта — Альметьевск"
              className="grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
});

ContactsPage.displayName = 'ContactsPage';

export default ContactsPage;
