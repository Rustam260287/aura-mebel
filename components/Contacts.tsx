
import React, { memo } from 'react';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, ClockIcon, WhatsAppIcon, TelegramIcon } from './icons/index';
import Image from 'next/image';
import { trackJourneyEvent } from '../lib/journey/client';
import { useExperience } from '../contexts/ExperienceContext';

const addresses = [
  {
    city: 'Альметьевск',
    line: 'ул. Ленина, 85а',
    phone: '+7 (987) 216-70-75',
    hours: 'Пн–Сб 10:00–20:00, Вс 11:00–19:00',
    coordinates: 'https://yandex.ru/map-widget/v1/?ll=52.298522%2C54.901576&mode=search&ol=geo&ouri=ymapsbm1%3A%2F%2Fgeo%3Fdata%3DCgg1NzQ1MzAzORJG0KDQvtGB0YHQuNGPLCDQoNC10YHQv9GD0LHQu9C40LrQsCDQotCw0YLQsNGA0YHRgtCw0L0sINCQ0LvRjNC80LXRgtGM0LXQstGB0LosINGD0LvQuNGG0LAg0JvQtdC90LjQvdCwLCA4NUEiCg2hQlFCFcRyUUI%2C&z=17.09'
  }
];

const phoneNumber = addresses[0]?.phone || '';
const cleanedPhone = phoneNumber.replace(/\D/g, '');
const waLink = `https://wa.me/${cleanedPhone}`;
const tgLink = `https://t.me/+${cleanedPhone}`;

export const Contacts: React.FC = memo(() => {
  const { state, emitEvent } = useExperience();
  const openChat = (text: string) => {
    void text;
    if (state === 'THREE_D_ACTIVE') {
      emitEvent({ type: 'EXIT_3D' });
    }
    emitEvent({ type: 'OPEN_ASSISTANT' });
  };

  return (
    <div className="bg-brand-cream-dark min-h-screen pb-20">

      {/* Hero Section */}
      <div className="bg-brand-brown text-white py-16 md:py-32 relative overflow-hidden">
        {/* Abstract Background instead of Image */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-brown via-brand-brown/95 to-brand-brown/90"></div>
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">Контакты</h1>
          <p className="text-xl text-white/80 max-w-xl font-light leading-relaxed">
            Мы создаем не просто мебель, а отношения. Напишите нам, позвоните или приходите в гости — мы всегда рады.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">

          {/* Info Card */}
          <div className="bg-white rounded-sm shadow-xl p-8 md:p-12 flex flex-col justify-between border-t-4 border-brand-terracotta">
            <div>
              <h2 className="text-3xl font-serif text-brand-charcoal mb-10">Наши локации</h2>
              <div className="space-y-12">
                {addresses.map((addr, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-start gap-5">
                      <div className="mt-1">
                        <MapPinIcon className="w-6 h-6 text-brand-terracotta" />
                      </div>
                      <div>
                        <p className="font-bold text-2xl text-brand-charcoal font-serif mb-1">{addr.city}</p>
                        <p className="text-brand-charcoal/70 text-lg font-light">{addr.line}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="w-6 flex justify-center">
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">{addr.hours}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100 space-y-4">
                <div className="flex items-center gap-5">
                  <div className="w-6 flex justify-center">
                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <a href={`tel:${cleanedPhone}`} className="text-xl font-medium text-brand-charcoal hover:text-brand-terracotta transition-colors">{phoneNumber}</a>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-6 flex justify-center">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <a href="mailto:hello@aura.app" className="text-lg text-brand-charcoal hover:text-brand-terracotta transition-colors">hello@aura.app</a>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Связаться с нами</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackJourneyEvent({ type: 'CONTACT_MANAGER' })}
                  className="flex items-center justify-center gap-3 py-4 rounded-sm border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all font-bold uppercase text-xs tracking-widest"
                >
                  <WhatsAppIcon className="w-5 h-5" /> WhatsApp
                </a>
                <a
                  href={tgLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackJourneyEvent({ type: 'CONTACT_MANAGER' })}
                  className="flex items-center justify-center gap-3 py-4 rounded-sm border border-[#0088cc] text-[#0088cc] hover:bg-[#0088cc] hover:text-white transition-all font-bold uppercase text-xs tracking-widest"
                >
                  <TelegramIcon className="w-5 h-5" /> Telegram
                </a>
              </div>
              <button
                onClick={() => openChat('')}
                className="w-full mt-4 flex items-center justify-center gap-3 py-4 rounded-sm bg-brand-charcoal text-white hover:bg-brand-brown transition-all font-bold uppercase text-xs tracking-widest shadow-lg shadow-brand-charcoal/20"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Задать вопрос
              </button>
            </div>
          </div>

          {/* Map Card */}
          <div className="bg-white rounded-sm shadow-xl overflow-hidden min-h-[500px] lg:min-h-full relative group">
            <iframe
              src={addresses[0].coordinates} // Пока показываем только одну карту для примера, можно сделать табы
              width="100%"
              height="100%"
              style={{ border: 0, position: 'absolute', inset: 0 }}
              allowFullScreen={false}
              loading="lazy"
              title="Карта"
              className="grayscale group-hover:grayscale-0 transition-all duration-700 opacity-90 group-hover:opacity-100"
            />
          </div>

        </div>
      </div>
    </div>
  );
});

Contacts.displayName = 'Contacts';
