
import React, { memo, useState } from 'react';
import Link from 'next/link';
import { useToast } from '../contexts/ToastContext';

const FooterComponent: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast(data.message, 'success');
        setEmail('');
      } else {
        addToast(data.message || 'Ошибка подписки', 'error');
      }
    } catch (error) {
      addToast('Не удалось подписаться. Попробуйте позже.', 'error');
    } finally {
      setLoading(false);
    }
  };

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
              <li className="mt-2">hello@labelcom.store</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-brand-charcoal mb-4">Подписка</h4>
            <p className="text-sm text-brand-charcoal/80 mb-4">Узнавайте о новинках первыми.</p>
             <form className="flex" onSubmit={handleSubscribe}>
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white border border-transparent rounded-l-md px-4 py-2 w-full focus:outline-none focus:border-brand-brown" 
                />
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-brand-brown text-white px-4 py-2 rounded-r-md hover:bg-brand-brown/90 transition-colors disabled:opacity-70"
                >
                    {loading ? '...' : 'OK'}
                </button>
             </form>
          </div>
        </div>
        <div className="mt-12 border-t border-brand-brown/20 pt-8 text-center text-sm text-brand-charcoal/60">
          &copy; {new Date().getFullYear()} Labelcom Мебель. Все права защищены.
          <br />
          <span className="text-xs mt-1 block">labelcom.store</span>
        </div>
      </div>
    </footer>
  );
};

export const Footer = memo(FooterComponent);
