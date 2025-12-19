
import React, { memo } from 'react';
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
    <div className="bg-warm-white min-h-screen pb-20">
      
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        <div className="mb-20">
            <h1 className="text-2xl font-medium text-soft-black mb-6">Доставка и Сервис</h1>
            <p className="text-base text-muted-gray leading-relaxed max-w-xl">
                Мы берем на себя ответственность за сохранность вашего заказа до момента, пока он не окажется у вас дома.
            </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
          {features.map((f, i) => (
            <div key={i} className="flex flex-col gap-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-stone-beige/30 text-soft-black">
                <f.icon className="w-6 h-6 stroke-1" />
              </div>
              <div>
                  <h3 className="text-base font-medium text-soft-black mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-gray leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-20">
          <h2 className="text-lg font-medium text-soft-black mb-8">Стоимость доставки</h2>
          <div className="bg-white rounded-xl overflow-hidden border border-stone-beige/20">
            <table className="w-full text-left text-sm">
              <thead className="bg-warm-white text-muted-gray font-normal border-b border-stone-beige/10">
                <tr>
                  <th className="px-6 py-4 font-normal">Регион</th>
                  <th className="px-6 py-4 font-normal">Стоимость</th>
                  <th className="px-6 py-4 font-normal">Сроки</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-beige/10">
                {rates.map((rate, i) => (
                  <tr key={i} className="text-soft-black">
                    <td className="px-6 py-4">{rate.region}</td>
                    <td className="px-6 py-4">{rate.price}</td>
                    <td className="px-6 py-4 text-muted-gray">{rate.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-gray">
              * Итоговая стоимость рассчитывается индивидуально и зависит от веса и габаритов заказа.
          </p>
        </div>

      </div>
    </div>
  );
});

ShippingPage.displayName = 'ShippingPage';
