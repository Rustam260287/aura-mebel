
import React, { memo, useState } from 'react';
import Link from 'next/link';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo'; // Import Logo

// Список email-адресов администраторов
const ADMIN_EMAILS = ['amin8914@gmail.com', 'admin@labelcom.store']; 

const FooterComponent: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const { addToast } = useToast();
  const { user } = useAuth(); // Получаем пользователя

  const isAdmin = user && user.email && ADMIN_EMAILS.includes(user.email);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (!agreed) {
        addToast('Необходимо согласие на обработку данных', 'error');
        return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast(
            <div>
                <p className="font-bold">Спасибо за подписку!</p>
                <p>Ваш промокод на скидку 5%: <span className="bg-white text-brand-brown px-1 rounded font-mono">LABELCOM5</span></p>
            </div>, 
            'success',
            5000
        );
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
    <footer className="bg-brand-cream-dark mt-auto border-t border-brand-brown/10">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Logo className="mb-4" /> {/* Logo */}
            <p className="text-brand-charcoal/80">Мебель, вдохновленная уютом и людьми.</p>
          </div>
          <div>
            <h4 className="font-semibold text-brand-charcoal mb-4">Навигация</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="text-brand-charcoal/80 hover:text-brand-brown">Каталог</Link></li>
              <li><Link href="/blog" className="text-brand-charcoal/80 hover:text-brand-brown">Блог</Link></li>
              <li><Link href="/about" className="text-brand-charcoal/80 hover:text-brand-brown">О нас</Link></li>
              <li><Link href="/contacts" className="text-brand-charcoal/80 hover:text-brand-brown">Контакты</Link></li>
              <li><Link href="/shipping" className="text-brand-charcoal/80 hover:text-brand-brown">Доставка и оплата</Link></li>
              {/* Показываем ссылку только админам */}
              {isAdmin && (
                  <li><Link href="/admin" className="text-red-500 hover:text-red-700 font-bold">Админ-панель</Link></li>
              )}
            </ul>
          </div>
           <div>
            <h4 className="font-semibold text-brand-charcoal mb-4">Контакты</h4>
            <ul className="space-y-2 text-brand-charcoal/80 text-sm">
              <li className="font-bold mb-1">ООО "Labelcom"</li>
              
              <li className="font-semibold text-brand-brown">Центральный офис</li>
              <li>г. Москва, Москва-Сити, Башня Федерация, 45 этаж</li>
              
              <li className="font-semibold text-brand-brown mt-2">Филиал в Республике Татарстан</li>
              <li>г. Альметьевск, ул. Ленина, 85а</li>
              
              <li className="mt-3 text-brand-brown hover:underline"><a href="mailto:hello@labelcom.store">hello@labelcom.store</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-brand-charcoal mb-4">Подписка</h4>
            <p className="text-sm text-brand-charcoal/80 mb-4">Подпишитесь и получите скидку 5% на первый заказ.</p>
             <form className="flex flex-col gap-2" onSubmit={handleSubscribe}>
                <div className="flex">
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white border border-transparent rounded-l-md px-4 py-2 w-full focus:outline-none focus:border-brand-brown text-sm" 
                    />
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-brand-brown text-white px-4 py-2 rounded-r-md hover:bg-brand-brown/90 transition-colors disabled:opacity-70 text-sm font-medium"
                    >
                        {loading ? '...' : 'OK'}
                    </button>
                </div>
                <label className="flex items-start gap-2 cursor-pointer mt-1">
                    <input 
                        type="checkbox" 
                        checked={agreed} 
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 accent-brand-brown"
                    />
                    <span className="text-[10px] text-gray-500 leading-tight">
                        Нажимая на кнопку, я даю согласие на обработку <Link href="/privacy" className="underline hover:text-brand-brown">персональных данных</Link>
                    </span>
                </label>
             </form>
          </div>
        </div>
        
        {/* Footer Bottom Links */}
        <div className="mt-12 border-t border-brand-brown/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-brand-charcoal/60 gap-4">
          <div className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Labelcom Мебель. Все права защищены.
          </div>
          <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-brand-brown transition-colors">Политика конфиденциальности</Link>
              <Link href="/terms" className="hover:text-brand-brown transition-colors">Публичная оферта</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const Footer = memo(FooterComponent);
