
import React, { memo } from 'react';
import { TruckIcon, MapPinIcon, ShieldCheckIcon, BanknotesIcon, ClockIcon, WrenchIcon } from '@heroicons/react/24/outline';

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
    <div className="bg-[#FAF9F6] min-h-screen pb-20">
      
      {/* Hero Section */}
      <div className="bg-brand-brown text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 leading-tight">Доставка и Сервис</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light">
            Мы позаботимся о том, чтобы ваша мебель прибыла в идеальном состоянии, где бы вы ни находились.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-10 relative z-20">
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center text-center hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-brand-cream text-brand-brown rounded-full flex items-center justify-center mb-6">
                <f.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-brand-charcoal mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Rates Table */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-16">
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-3xl font-serif text-brand-charcoal mb-2 text-center">Ориентировочная стоимость</h2>
            <p className="text-gray-500 text-center text-sm">Точный расчет производится менеджером после оформления заказа, учитывая вес и габариты.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
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
                    <td className="px-8 py-5 text-gray-500 text-sm">{rate.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-brand-cream/20 text-center text-sm text-gray-500">
            Мы работаем с лидерами логистики: <strong>СДЭК, ПЭК, Деловые Линии</strong>.
          </div>
        </div>

        {/* Payment Section */}
        <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-6">
                <BanknotesIcon className="w-6 h-6 text-brand-brown mr-2" />
                <span className="font-bold text-brand-charcoal uppercase tracking-widest text-xs">Безопасная оплата</span>
            </div>
            <h2 className="text-3xl font-serif text-brand-charcoal mb-6">Как оплатить заказ?</h2>
            <p className="text-gray-600 leading-relaxed mb-8">
                Оплата производится после полного согласования деталей заказа с персональным менеджером. Мы выставим вам официальный счет или ссылку на оплату. Возможна оплата картой, банковским переводом или в рассрочку от банков-партнеров.
            </p>
        </div>

      </div>
    </div>
  );
});

ShippingPage.displayName = 'ShippingPage';
