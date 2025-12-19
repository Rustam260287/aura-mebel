
import React, { memo } from 'react';
import { TruckIcon, MapPinIcon, ShieldCheckIcon, BanknotesIcon, ClockIcon, WrenchIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

const features = [
  {
    icon: TruckIcon,
    title: 'Бережная доставка',
    desc: 'Специальная упаковка для хрупких грузов и страхование на полную стоимость.'
  },
  {
    icon: MapPinIcon,
    title: 'Вся Россия',
    desc: 'Доставляем в любой регион: от Калининграда до Владивостока.'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Гарантия качества',
    desc: 'Если товар приедет с повреждением, мы заменим его за свой счет.'
  },
  {
    icon: WrenchIcon,
    title: 'Сборка',
    desc: 'Предоставляем контакты проверенных сборщиков в крупных городах.'
  }
];

const rates = [
  { region: 'Москва и МО', price: 'от 2 500 ₽', time: '1-3 дня' },
  { region: 'Санкт-Петербург', price: 'от 3 500 ₽', time: '2-4 дня' },
  { region: 'Центральная Россия', price: 'от 4 000 ₽', time: '3-6 дней' },
  { region: 'Урал и Сибирь', price: 'от 6 000 ₽', time: '5-10 дней' },
  { region: 'Дальний Восток', price: 'по запросу', time: '10-18 дней' },
];

export const ShippingPage: React.FC = memo(() => {
  return (
    <div className="bg-brand-cream-dark min-h-screen pb-20">
      
      {/* Hero Section */}
      <div className="bg-brand-brown text-white py-16 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-charcoal/80 to-brand-brown/90" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">Доставка и Сервис</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
            Мы позаботимся о том, чтобы ваша мебель прибыла в идеальном состоянии, где бы вы ни находились.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-16 relative z-20">
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-sm shadow-xl p-8 flex flex-col items-start border-t-4 border-brand-terracotta hover:-translate-y-2 transition-transform duration-300">
              <div className="mb-6 text-brand-terracotta">
                <f.icon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-serif font-bold text-brand-charcoal mb-3">{f.title}</h3>
              <p className="text-sm text-brand-charcoal/70 leading-relaxed font-light">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Rates Table */}
        <div className="max-w-4xl mx-auto bg-white rounded-sm shadow-xl overflow-hidden mb-24">
          <div className="p-10 md:p-12 border-b border-gray-100 bg-white">
            <h2 className="text-3xl font-serif text-brand-charcoal mb-4 text-center">Ориентировочная стоимость</h2>
            <p className="text-brand-charcoal/60 text-center text-sm font-light max-w-lg mx-auto">Точный расчет производится менеджером после оформления заказа, учитывая вес, габариты и адрес доставки.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-cream-dark text-[10px] font-bold text-brand-charcoal/50 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Регион</th>
                  <th className="px-8 py-5">Стоимость</th>
                  <th className="px-8 py-5">Сроки</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rates.map((rate, i) => (
                  <tr key={i} className="hover:bg-brand-cream/30 transition-colors bg-white">
                    <td className="px-8 py-6 text-brand-charcoal font-medium text-sm">{rate.region}</td>
                    <td className="px-8 py-6 text-brand-terracotta font-bold text-sm">{rate.price}</td>
                    <td className="px-8 py-6 text-brand-charcoal/60 text-xs font-medium">{rate.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-brand-charcoal text-center text-xs text-white/60 tracking-wider uppercase font-medium">
            Мы работаем с лидерами логистики: <span className="text-white">СДЭК, ПЭК, Деловые Линии</span>
          </div>
        </div>

        {/* Payment Section */}
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center bg-white p-12 rounded-sm shadow-xl">
            <div className="flex-1">
                 <div className="inline-flex items-center gap-2 mb-4 text-brand-terracotta text-xs font-bold uppercase tracking-widest">
                    <BanknotesIcon className="w-5 h-5" />
                    <span>Безопасная оплата</span>
                </div>
                <h2 className="text-3xl font-serif text-brand-charcoal mb-6">Как оплатить заказ?</h2>
                <p className="text-brand-charcoal/70 leading-loose font-light mb-8 text-sm">
                    Оплата производится после полного согласования деталей заказа с персональным менеджером. Мы выставим вам официальный счет или ссылку на оплату. Возможна оплата картой, банковским переводом или в рассрочку от банков-партнеров.
                </p>
                <div className="flex gap-4">
                     <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center grayscale opacity-50"><span className="text-[10px] font-bold">VISA</span></div>
                     <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center grayscale opacity-50"><span className="text-[10px] font-bold">MC</span></div>
                     <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center grayscale opacity-50"><span className="text-[10px] font-bold">MIR</span></div>
                </div>
            </div>
            <div className="flex-1 relative h-64 w-full md:w-auto rounded-sm overflow-hidden">
                 <div className="absolute inset-0 bg-brand-terracotta/10"></div>
                  {/* Decorative element resembling a receipt or card */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 bg-white shadow-2xl rounded-lg rotate-3 flex flex-col p-4 border border-gray-100">
                      <div className="h-2 w-12 bg-gray-200 rounded mb-4"></div>
                      <div className="h-2 w-24 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 w-20 bg-gray-200 rounded"></div>
                      <div className="mt-auto flex justify-between items-end">
                           <div className="h-6 w-6 rounded-full bg-brand-terracotta/20"></div>
                           <div className="h-2 w-8 bg-brand-terracotta rounded"></div>
                      </div>
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
});

ShippingPage.displayName = 'ShippingPage';
