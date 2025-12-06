import React, { memo } from 'react';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, WhatsAppIcon, TelegramIcon, ClockIcon, ChatBubbleLeftRightIcon, MaxMessengerIcon } from './Icons';

const addresses = [
  {
    city: 'Альметьевск',
    line: 'ул. Ленина, 85а',
    phone: '+7 (987) 216-70-75',
    hours: 'Пн–Сб 10:00–20:00, Вс 11:00–19:00',
  },
];

const phoneNumber = addresses[0]?.phone || '';
const cleanedPhone = phoneNumber.replace(/\D/g, '');
const maxLink = `https://max.ru/?phone=${cleanedPhone}`;
const waLink = `https://wa.me/${cleanedPhone}`;
const tgLink = `https://t.me/+${cleanedPhone}`;

export const Contacts: React.FC = memo(() => {
  const openChat = (text: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openStylistChat', { detail: { text } }));
    }
  };

  return (
    <div className="bg-white text-brand-charcoal">
      <div className="container mx-auto px-6 py-14">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-brand-cream">
          <div className="grid lg:grid-cols-2">
            <div className="p-10 space-y-8">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">Контакты</p>
                <h1 className="text-3xl md:text-4xl font-serif font-bold mt-2 text-brand-charcoal">Всегда на связи</h1>
                <p className="text-gray-600 mt-3 text-lg">
                  Подберём мебель, отправим дополнительные фото и рассчитаем доставку. Пишите, звоните или оставляйте заявку — менеджер ответит в течение 15 минут.
                </p>
              </div>

              <div className="space-y-5">
                {addresses.map((addr) => (
                  <div key={addr.line} className="bg-brand-cream/40 rounded-2xl p-5 border border-brand-cream">
                    <div className="flex items-center gap-3 text-lg font-semibold">
                      <MapPinIcon className="w-5 h-5 text-brand-brown" />
                      <span>{addr.city}</span>
                    </div>
                    <p className="mt-2 text-gray-700">{addr.line}</p>
                    <div className="mt-3 space-y-2 text-gray-700 text-sm">
                      <p className="flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4 text-brand-brown" />
                        <a href={`tel:${addr.phone.replace(/\\D/g, '')}`} className="hover:text-brand-brown">{addr.phone}</a>
                      </p>
                      <p className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-brand-brown" />
                        {addr.hours}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <a
                  href={maxLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#1a0f2e] via-[#2d1847] to-[#9941db] text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
                >
                  <MaxMessengerIcon className="w-5 h-5" /> Max
                </a>
                <div className="grid sm:grid-cols-2 gap-4">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-[#25D366] text-[#0f0c08] font-semibold hover:shadow-lg transition-shadow"
                  >
                    <WhatsAppIcon className="w-5 h-5" /> WhatsApp
                  </a>
                  <a
                    href={tgLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-[#229ED9] text-white font-semibold hover:shadow-lg transition-shadow"
                  >
                    <TelegramIcon className="w-5 h-5" /> Telegram
                  </a>
                  <a
                    href="mailto:hello@labelcom.store"
                    className="flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-brand-cream text-brand-charcoal font-semibold hover:bg-brand-cream/80 transition-colors col-span-1 sm:col-span-2"
                  >
                    <EnvelopeIcon className="w-5 h-5 text-brand-brown" /> hello@labelcom.store
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openChat('Здравствуйте! Нужна помощь AI-стилиста в подборе мебели.')}
                className="flex items-center gap-3 bg-brand-cream/50 border border-brand-cream rounded-2xl p-4 hover:bg-brand-cream/70 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-brown/50"
              >
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-brand-brown" />
                <div>
                  <p className="font-semibold">AI-консультант</p>
                  <p className="text-gray-700 text-sm">Опишите задачу — предложим подборку за секунды.</p>
                </div>
              </button>
            </div>

            <div className="bg-white">
              <div className="h-full min-h-[420px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2279.791556942062!2d52.28822007727181!3d54.90382347318043!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x41601633a436e529%3A0x8672957ddefb231a!2z0YPQu9C70YvQs9Cw0L3QvdGL0YAg0JvQtdC00LXQu9C-0LLQsNC60LAg0L¦LiDQsy4g0JvQtdC00LXQu9C-0LLQsNC60LA!5e0!3m2!1sru!2sru!4v1700940000000!5m2!1sru!2sru"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Карта расположения Labelcom"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Contacts.displayName = 'Contacts';
