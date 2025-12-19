
import React, { memo, useState } from 'react';
import Link from 'next/link';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';

// Список email-адресов администраторов
const ADMIN_EMAILS = ['amin8914@gmail.com', 'admin@labelcom.store']; 

const FooterComponent: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const { addToast } = useToast();
  const { user } = useAuth();

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
    <footer className="bg-[#F1EDE4] pt-20 pb-12 text-[#59443B]">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          
          {/* Column 1: Logo & Tagline */}
          <div className="space-y-6">
            <Logo variant="dark" />
            <p className="text-sm leading-relaxed max-w-[240px]">
              Мебель, вдохновленная уютом и людьми.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-8 tracking-tight">Навигация</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/products" className="hover:opacity-60 transition-opacity">Каталог</Link></li>
              <li><Link href="/blog" className="hover:opacity-60 transition-opacity">Блог</Link></li>
              <li><Link href="/about" className="hover:opacity-60 transition-opacity">О нас</Link></li>
              <li><Link href="/contacts" className="hover:opacity-60 transition-opacity">Контакты</Link></li>
              <li><Link href="/shipping" className="hover:opacity-60 transition-opacity">Доставка и оплата</Link></li>
              {isAdmin && (
                  <li><Link href="/admin" className="text-red-500 hover:opacity-60 transition-opacity">Админ-панель</Link></li>
              )}
            </ul>
          </div>

          {/* Column 3: Contacts */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-8 tracking-tight">Контакты</h4>
            <div className="text-sm space-y-6">
                <div>
                    <p className="font-bold mb-1 tracking-tight">ООО "Labelcom"</p>
                </div>
                <div>
                    <p className="font-bold mb-1 tracking-tight">Центральный офис</p>
                    <p className="opacity-70 leading-relaxed font-light">г. Москва, Москва-Сити, Башня Федерация, 45 этаж</p>
                </div>
                <div>
                    <p className="font-bold mb-1 tracking-tight">Филиал в Республике Татарстан</p>
                    <p className="opacity-70 leading-relaxed font-light">г. Альметьевск, ул. Ленина, 85а</p>
                </div>
                <div>
                    <a href="mailto:hello@labelcom.store" className="hover:opacity-60 transition-opacity font-medium">hello@labelcom.store</a>
                </div>
            </div>
          </div>

          {/* Column 4: Subscription */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-8 tracking-tight">Подписка</h4>
            <p className="text-sm mb-8 opacity-70 leading-relaxed font-light">
                Подпишитесь и получите скидку 5% на первый заказ.
            </p>
            <form className="flex flex-col gap-4" onSubmit={handleSubscribe}>
                <div className="flex bg-white rounded overflow-hidden shadow-sm">
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-transparent px-4 py-3 w-full focus:outline-none text-sm text-[#3E3836] placeholder:text-[#3E3836]/40" 
                    />
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-[#59443B] text-white px-6 py-3 text-sm font-bold hover:bg-[#3E3836] transition-colors disabled:opacity-70"
                    >
                        {loading ? '...' : 'OK'}
                    </button>
                </div>
                <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        checked={agreed} 
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 accent-[#59443B] w-4 h-4 rounded border-transparent"
                    />
                    <span className="text-[10px] opacity-70 leading-tight group-hover:opacity-100 transition-opacity">
                        Нажимая на кнопку, я даю согласие на обработку <Link href="/privacy" className="underline hover:opacity-100">персональных данных</Link>
                    </span>
                </label>
            </form>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-10 border-t border-[#59443B]/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-medium tracking-wide">
          <p className="opacity-50">© {new Date().getFullYear()} Labelcom Мебель. Все права защищены.</p>
          <div className="flex gap-8 opacity-60">
              <Link href="/privacy" className="hover:opacity-100 transition-opacity uppercase tracking-widest">Политика конфиденциальности</Link>
              <Link href="/terms" className="hover:opacity-100 transition-opacity uppercase tracking-widest">Публичная оферта</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const Footer = memo(FooterComponent);
