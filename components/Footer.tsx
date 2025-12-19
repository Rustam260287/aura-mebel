
import React, { memo, useState } from 'react';
import Link from 'next/link';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo'; // Import Logo
import { cn } from '../utils';

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
    <footer className="bg-brand-cream border-t border-brand-brown/10 relative overflow-hidden">
        {/* Декоративный элемент - очень тонкий градиент/свечение в футере */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-brand-terracotta/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-10 md:gap-8">
          <div className="lg:col-span-2">
            <Logo className="mb-6 scale-90 origin-left" /> 
            <p className="text-brand-charcoal/70 max-w-sm mb-6 leading-relaxed">
              Мы создаем мебель, которая становится сердцем вашего дома. Изысканный дизайн, 
              натуральные материалы и внимание к каждой детали.
            </p>
            {/* Social Links placeholder - можно добавить иконки соцсетей здесь */}
             <div className="flex gap-4">
                {/* Пример иконок */}
                <div className="w-8 h-8 rounded-full bg-brand-brown/10 flex items-center justify-center text-brand-brown hover:bg-brand-brown hover:text-white transition-colors cursor-pointer">
                    <span className="sr-only">Instagram</span>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-brown/10 flex items-center justify-center text-brand-brown hover:bg-brand-brown hover:text-white transition-colors cursor-pointer">
                     <span className="sr-only">Telegram</span>
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-3.8 17.5c-.32 0-.67-.18-.88-.47l-2.45-3.32c-.34-.47-.14-1.14.43-1.34l9.16-3.15c.57-.2 1.15.28.98.86l-2.58 9.32c-.15.54-.85.73-1.29.35l-3.37-2.95z"/></svg>
                </div>
             </div>
          </div>
          <div>
            <h4 className="font-serif text-lg text-brand-charcoal mb-6">Компания</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/products" className="text-brand-charcoal/60 hover:text-brand-terracotta transition-colors">Каталог</Link></li>
              <li><Link href="/blog" className="text-brand-charcoal/60 hover:text-brand-terracotta transition-colors">Блог</Link></li>
              <li><Link href="/about" className="text-brand-charcoal/60 hover:text-brand-terracotta transition-colors">О нас</Link></li>
              <li><Link href="/contacts" className="text-brand-charcoal/60 hover:text-brand-terracotta transition-colors">Контакты</Link></li>
              <li><Link href="/shipping" className="text-brand-charcoal/60 hover:text-brand-terracotta transition-colors">Доставка</Link></li>
              {isAdmin && (
                  <li><Link href="/admin" className="text-brand-terracotta/80 hover:text-brand-terracotta font-medium">Админ-панель</Link></li>
              )}
            </ul>
          </div>
           <div className="lg:col-span-2">
            <h4 className="font-serif text-lg text-brand-charcoal mb-6">Свяжитесь с нами</h4>
            <ul className="space-y-4 text-brand-charcoal/60 text-sm">
              
              <li className="flex gap-3 items-start">
                <span className="text-brand-terracotta mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </span>
                <div>
                     <p className="font-medium text-brand-charcoal mb-1">Москва</p>
                     <p>Башня Федерация, 45 этаж</p>
                </div>
              </li>
              
               <li className="flex gap-3 items-start">
                <span className="text-brand-terracotta mt-0.5">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </span>
                <div>
                     <p className="font-medium text-brand-charcoal mb-1">Альметьевск</p>
                     <p>ул. Ленина, 85а</p>
                </div>
              </li>
              
              <li className="flex gap-3 items-center">
                 <span className="text-brand-terracotta">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                 </span>
                 <a href="mailto:hello@labelcom.store" className="hover:text-brand-terracotta transition-colors">hello@labelcom.store</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-brand-brown/10 pt-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                    <h4 className="font-serif text-lg text-brand-charcoal mb-2">Получите скидку 5%</h4>
                    <p className="text-sm text-brand-charcoal/60 mb-4">Подпишитесь на наши новости и получите промокод на первый заказ.</p>
                </div>
                 <form className="flex flex-col gap-3" onSubmit={handleSubscribe}>
                    <div className="flex relative">
                        <input 
                            type="email" 
                            placeholder="Ваш Email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-transparent border-b border-brand-charcoal/20 px-0 py-2 w-full focus:outline-none focus:border-brand-terracotta text-sm placeholder:text-brand-charcoal/30 transition-colors" 
                        />
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="absolute right-0 bottom-2 text-brand-terracotta font-medium text-sm hover:text-brand-terracotta-dark disabled:opacity-50 uppercase tracking-wider"
                        >
                            {loading ? '...' : 'Подписаться'}
                        </button>
                    </div>
                    <label className="flex items-start gap-2 cursor-pointer mt-1 group">
                        <input 
                            type="checkbox" 
                            checked={agreed} 
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-0.5 accent-brand-terracotta w-3 h-3 border-gray-300 rounded focus:ring-brand-terracotta"
                        />
                        <span className="text-[10px] text-gray-400 leading-tight group-hover:text-gray-500 transition-colors">
                            Я согласен с <Link href="/privacy" className="underline decoration-gray-300 hover:decoration-brand-terracotta">политикой конфиденциальности</Link>
                        </span>
                    </label>
                 </form>
            </div>
        </div>
        
        {/* Footer Bottom Links */}
        <div className="mt-12 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-wider text-brand-charcoal/40 gap-4">
          <div className="text-center md:text-left">
            &copy; {new Date().getFullYear()} LABELCOM. Все права защищены.
          </div>
          <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-brand-terracotta transition-colors">Конфиденциальность</Link>
              <Link href="/terms" className="hover:text-brand-terracotta transition-colors">Оферта</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const Footer = memo(FooterComponent);
