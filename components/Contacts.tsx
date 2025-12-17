
import React, { memo } from 'react';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, ClockIcon } from '@heroicons/react/24/outline';
// Используем иконки брендов из нашего набора, если есть, или имитируем
import { WhatsAppIcon, TelegramIcon } from './Icons'; 

const addresses = [
  {
    city: 'Альметьевск',
    line: 'ул. Ленина, 85а',
    phone: '+7 (987) 216-70-75',
    hours: 'Пн–Сб 10:00–20:00, Вс 11:00–19:00',
    coordinates: 'https://yandex.ru/map-widget/v1/?ll=52.298522%2C54.901576&mode=search&ol=geo&ouri=ymapsbm1%3A%2F%2Fgeo%3Fdata%3DCgg1NzQ1MzAzORJG0KDQvtGB0YHQuNGPLCDQoNC10YHQv9GD0LHQu9C40LrQsCDQotCw0YLQsNGA0YHRgtCw0L0sINCQ0LvRjNC80LXRgtGM0LXQstGB0LosINGD0LvQuNGG0LAg0JvQtdC90LjQvdCwLCA4NUEiCg2hQlFCFcRyUUI%2C&z=17.09'
  },
];

const phoneNumber = addresses[0]?.phone || '';
const cleanedPhone = phoneNumber.replace(/\D/g, '');
const waLink = `https://wa.me/${cleanedPhone}`;
const tgLink = `https://t.me/+${cleanedPhone}`;

export const Contacts: React.FC = memo(() => {
  const openChat = (text: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openStylistChat', { detail: { text } }));
    }
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-20">
      
      {/* Hero Section */}
      <div className="bg-brand-brown text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 leading-tight">Наши Контакты</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light">
            Мы всегда рады слышать вас. Свяжитесь с нами любым удобным способом.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 flex flex-col justify-between border border-gray-100">
                <div>
                    <h2 className="text-2xl font-serif text-brand-charcoal mb-6">Шоурум</h2>
                    <div className="space-y-6">
                        {addresses.map((addr) => (
                            <div key={addr.line} className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center flex-shrink-0 text-brand-brown">
                                        <MapPinIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-brand-charcoal">{addr.city}</p>
                                        <p className="text-gray-600">{addr.line}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center flex-shrink-0 text-brand-brown">
                                        <ClockIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-brand-charcoal">Режим работы</p>
                                        <p className="text-gray-600">{addr.hours}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center flex-shrink-0 text-brand-brown">
                                        <PhoneIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-brand-charcoal">Телефон</p>
                                        <a href={`tel:${cleanedPhone}`} className="text-brand-brown hover:underline text-lg block">{phoneNumber}</a>
                                        <a href="mailto:hello@labelcom.store" className="text-gray-500 hover:text-brand-brown text-sm block mt-1">hello@labelcom.store</a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-10 border-t border-gray-100 pt-8">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Мессенджеры</p>
                    <div className="grid grid-cols-2 gap-4">
                        <a href={waLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all font-medium">
                            <WhatsAppIcon className="w-5 h-5" /> WhatsApp
                        </a>
                        <a href={tgLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc] hover:text-white transition-all font-medium">
                            <TelegramIcon className="w-5 h-5" /> Telegram
                        </a>
                    </div>
                    <button
                        onClick={() => openChat('Здравствуйте! Помогите с выбором.')}
                        className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-brand-brown text-brand-brown hover:bg-brand-brown hover:text-white transition-all font-bold"
                    >
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        Чат с менеджером
                    </button>
                </div>
            </div>

            {/* Map Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 min-h-[400px] lg:min-h-full relative group">
                <iframe
                    src={addresses[0].coordinates}
                    width="100%"
                    height="100%"
                    style={{ border: 0, position: 'absolute', inset: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    title="Карта"
                    className="grayscale group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 pointer-events-none border-2 border-white/50 rounded-2xl m-2"></div>
            </div>

        </div>
      </div>
    </div>
  );
});

Contacts.displayName = 'Contacts';
