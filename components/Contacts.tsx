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
    <div className="bg-brand-cream text-brand-charcoal">
      <div className="container mx-auto px-6 py-14">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr,0.95fr] gap-8">
          <div className="bg-white/90 backdrop-blur rounded-3xl border border-brand-cream shadow-premium p-8 md:p-10 space-y-8">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">Контакты</p>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-brown">Всегда на связи</h1>
              <p className="text-gray-700 text-lg">
                Подберём мебель, отправим дополнительные фото и рассчитаем доставку. Пишите, звоните или оставляйте заявку — менеджер ответит в течение 15 минут.
              </p>
            </div>

            <div className="space-y-4">
              {addresses.map((addr) => (
                <div key={addr.line} className="rounded-2xl border border-brand-cream bg-brand-cream/60 p-5 shadow-premium">
                  <div className="flex items-center gap-3 text-lg font-semibold text-brand-brown">
                    <MapPinIcon className="w-5 h-5" />
                    <span>{addr.city}</span>
                  </div>
                  <p className="mt-2 text-gray-700">{addr.line}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-700">
                    <span className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-brand-brown" />
                      <a href={`tel:${addr.phone.replace(/\D/g, '')}`} className="hover:text-brand-brown">
                        {addr.phone}
                      </a>
                    </span>
                    <span className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-brand-brown" />
                      {addr.hours}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">Мессенджеры и почта</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <a
                  href={maxLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-brand-brown text-white font-semibold shadow-premium hover:-translate-y-0.5 transition"
                >
                  <span className="flex items-center gap-2">
                    <MaxMessengerIcon className="w-5 h-5" /> Max
                  </span>
                  <span className="text-xs uppercase tracking-wide text-white/80">быстро</span>
                </a>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-brand-cream bg-brand-cream/70 text-brand-charcoal font-semibold shadow-premium-hover hover:border-brand-brown hover:-translate-y-0.5 transition"
                >
                  <span className="flex items-center gap-2">
                    <WhatsAppIcon className="w-5 h-5 text-brand-brown" /> WhatsApp
                  </span>
                  <span className="text-xs uppercase tracking-wide text-brand-brown/80">15 мин</span>
                </a>
                <a
                  href={tgLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-brand-cream bg-white text-brand-charcoal font-semibold shadow-premium-hover hover:border-brand-brown hover:-translate-y-0.5 transition"
                >
                  <span className="flex items-center gap-2">
                    <TelegramIcon className="w-5 h-5 text-brand-brown" /> Telegram
                  </span>
                  <span className="text-xs uppercase tracking-wide text-brand-brown/80">15 мин</span>
                </a>
                <a
                  href="mailto:hello@labelcom.store"
                  className="sm:col-span-2 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-brand-cream bg-brand-cream text-brand-charcoal font-semibold shadow-premium-hover hover:border-brand-brown hover:-translate-y-0.5 transition"
                >
                  <span className="flex items-center gap-2">
                    <EnvelopeIcon className="w-5 h-5 text-brand-brown" /> hello@labelcom.store
                  </span>
                  <span className="text-xs uppercase tracking-wide text-brand-brown/80">в течение дня</span>
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openChat('Здравствуйте! Нужна помощь AI-стилиста в подборе мебели.')}
              className="w-full flex items-center gap-3 justify-between rounded-2xl border border-brand-brown/30 bg-brand-cream px-4 py-4 hover:border-brand-brown hover:-translate-y-0.5 transition shadow-premium-hover"
            >
              <div className="flex items-center gap-3">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-brand-brown" />
                <div className="text-left">
                  <p className="font-semibold text-brand-brown">AI-консультант</p>
                  <p className="text-gray-700 text-sm">Опишите задачу — предложим подборку за секунды.</p>
                </div>
              </div>
              <span className="text-xs uppercase tracking-wide text-brand-brown/80">24/7</span>
            </button>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-3xl border border-brand-cream shadow-premium overflow-hidden">
            <div className="p-6 border-b border-brand-cream space-y-2">
              <div className="flex items-center gap-2 text-brand-brown font-semibold">
                <MapPinIcon className="w-5 h-5" /> Салон в Альметьевске
              </div>
              <p className="text-sm text-gray-700">Увидите ткани, протестируете посадку диванов и подберёте комплект вместе с менеджером.</p>
            </div>
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
  );
});

Contacts.displayName = 'Contacts';
