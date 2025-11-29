
import React, { memo } from 'react';
import Link from 'next/link';

const FooterComponent: React.FC = () => {
  return (
    <footer className="bg-brand-cream-dark mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-serif text-brand-brown mb-4">Labelcom</h3>
            <p className="text-brand-charcoal/80">Мебель, вдохновленная уютом и людьми.</p>
          </div>
          <div>
            <h4 className="font-semibold text-brand-charcoal mb-4">Навигация</h4>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-brand-charcoal/80 hover:text-brand-brown">Каталог</Link></li>
              <li><Link href="/blog" className="text-brand-charcoal/80 hover:text-brand-brown">Блог</Link></li>
              <li><Link href="/about" className="text-brand-charcoal/80 hover:text-brand-brown">О нас</Link></li>
              <li><Link href="/contacts" className="text-brand-charcoal/80 hover:text-brand-brown">Контакты</Link></li>
              <li><Link href="/shipping" className="text-brand-charcoal/80 hover:text-brand-brown">Доставка и оплата</Link></li>
              <li><Link href="/admin" className="text-brand-charcoal/80 hover:text-brand-brown">Админ-панель</Link></li>
            </ul>
          </div>
           <div>
            <h4 className="font-semibold text-brand-charcoal mb-4">Контакты</h4>
            <ul className="space-y-2 text-brand-charcoal/80 text-sm">
              <li className="font-semibold">ООО ЛЭЙБЛКОМ</li>
              <li>г. Москва, Москва-Сити, Башня Федерация, 45 этаж</li>
              <li className="font-semibold mt-2">Республика Татарстан</li>
              <li>г. Альметьевск, ул. Ленина, 85а</li>
              <li className="mt-2">hello@labelcom.ru</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-brand-charcoal mb-4">Подписка</h4>
            <p className="text-sm text-brand-charcoal/80 mb-4">Узнавайте о новинках первыми.</p>
             <form className="flex">
                <input type="email" placeholder="Email" className="bg-white border border-transparent rounded-l-md px-4 py-2 w-full focus:outline-none focus:border-brand-brown" />
                <button type="submit" className="bg-brand-brown text-white px-4 py-2 rounded-r-md hover:bg-brand-brown/90 transition-colors">OK</button>
             </form>
          </div>
        </div>
        <div className="mt-12 border-t border-brand-brown/20 pt-8 text-center text-sm text-brand-charcoal/60">
          &copy; {new Date().getFullYear()} Labelcom Мебель. Все права защищены.
        </div>
      </div>
    </footer>
  );
};

export const Footer = memo(FooterComponent);
