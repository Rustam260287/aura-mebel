
import React, { memo } from 'react';
import type { View } from '../types';
import { TruckIcon, MapPinIcon, ShieldCheckIcon, BanknotesIcon } from '@heroicons/react/24/outline'; // WrenchIcon removed as it's not in the restored Icons.tsx

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
  // {
  //   icon: WrenchIcon, // This icon is missing, so we comment out this feature
  //   title: 'Сборка',
  //   desc: 'Предоставляем контакты проверенных сборщиков в крупных городах.'
  // }
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
    <div className="bg-[#FAF9F6] min-h-screen pb-20">
      
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif text-brand-brown mb-4">Доставка и Сервис</h1>
            <p className="text-lg text-brand-charcoal/70 max-w-2xl mx-auto">
                Мы позаботимся о том, чтобы ваша мебель прибыла в идеальном состоянии, где бы вы ни находились.
            </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-lg shadow-soft border border-brand-brown/5 text-center">
              <div className="w-16 h-16 bg-brand-cream text-brand-brown rounded-full flex items-center justify-center mx-auto mb-6">
                <f.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-soft border border-brand-brown/5 overflow-hidden mb-16">
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-3xl font-serif text-brand-charcoal mb-2 text-center">Стоимость доставки</h2>
            <p className="text-gray-500 text-center text-sm">Точный расчет производится менеджером после оформления заказа.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-4">Регион</th>
                  <th className="px-8 py-4">Стоимость</th>
                  <th className="px-8 py-4">Сроки</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rates.map((rate, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5 text-brand-charcoal font-medium">{rate.region}</td>
                    <td className="px-8 py-5 text-brand-brown font-bold">{rate.price}</td>
                    <td className="px-8 py-5 text-gray-500">{rate.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="max-w-3xl mx-auto text-center p-8 bg-brand-cream rounded-lg">
            <BanknotesIcon className="w-10 h-10 text-brand-brown mx-auto mb-4" />
            <h2 className="text-3xl font-serif text-brand-charcoal mb-4">Оплата заказа</h2>
            <p className="text-gray-600 leading-relaxed">
                Оплата производится после согласования деталей заказа с менеджером. Мы выставим вам счет или ссылку на оплату. Возможна оплата картой, банковским переводом или в рассрочку.
            </p>
        </div>

      </div>
    </div>
  );
});

ShippingPage.displayName = 'ShippingPage';
