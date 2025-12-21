
import React, { memo, useState } from 'react';
import Link from 'next/link';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';
import { Button } from './Button';
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
    // if (!agreed) { // Optional: можно сделать обязательным, если нужно строгое соблюдение GDPR
    //     addToast('Необходимо согласие на обработку данных', 'error');
    //     return;
    // }

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
                <p className="font-bold">Вы подписаны!</p>
                <p>Мы будем держать вас в курсе новинок.</p>
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
    <footer className="bg-warm-white border-t border-stone-beige/20 pt-20 pb-10 text-soft-black">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* 1. Бренд */}
          <div className="space-y-4">
            <Logo variant="dark" />
            <p className="text-sm text-muted-gray leading-relaxed font-light">
              Мебель, вдохновлённая уютом и людьми.
            </p>
          </div>

          {/* 2. Сервисная навигация */}
          <div>
            <h4 className="font-medium text-soft-black mb-6">Навигация</h4>
            <ul className="space-y-3 text-sm text-muted-gray">
              <li><Link href="/products" className="hover:text-soft-black transition-colors">Каталог</Link></li>
              <li><Link href="/wishlist" className="hover:text-soft-black transition-colors">Сохранено</Link></li>
              <li><Link href="/contacts" className="hover:text-soft-black transition-colors">Контакты</Link></li>
              <li><Link href="/shipping" className="hover:text-soft-black transition-colors">Доставка и оплата</Link></li>
               {isAdmin && (
                  <li><Link href="/admin" className="text-red-500 hover:text-red-700 font-medium">Админ-панель</Link></li>
              )}
            </ul>
          </div>

          {/* 3. Контакты */}
          <div>
            <h4 className="font-medium text-soft-black mb-6">Контакты</h4>
            <div className="text-sm text-muted-gray space-y-4 font-light">
              <p className="font-medium text-soft-black">ООО «Labelcom»</p>
              <p>г. Москва, Москва-Сити, Башня Федерация, 45 этаж</p>
              <p>г. Альметьевск, ул. Ленина, 85а</p>
              <a href="mailto:hello@labelcom.store" className="block hover:text-soft-black transition-colors font-medium">hello@labelcom.store</a>
            </div>
          </div>
          
          {/* 4. Подписка */}
          <div>
            <h4 className="font-medium text-soft-black mb-6">Обновления</h4>
            <p className="text-sm text-muted-gray mb-6 font-light">
              Узнавайте о новых моделях и возможностях примерки.
            </p>
            <form className="flex" onSubmit={handleSubscribe}>
              <input 
                type="email" 
                placeholder="Ваш email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white px-4 py-3 rounded-l-lg text-sm focus:outline-none border border-stone-beige/20 placeholder:text-muted-gray/50 text-soft-black"
              />
              <Button 
                variant="primary" 
                size="md" 
                className="rounded-l-none rounded-r-lg px-4 bg-soft-black hover:bg-black"
                disabled={loading}
              >
                {loading ? '...' : '→'}
              </Button>
            </form>
          </div>

        </div>

        {/* Нижняя полоса */}
        <div className="pt-8 border-t border-stone-beige/20 flex flex-col md:flex-row justify-between items-center text-xs text-muted-gray gap-4">
          <p>© {new Date().getFullYear()} Labelcom. Все права защищены.</p>
           <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-soft-black transition-colors">Политика конфиденциальности</Link>
              <Link href="/terms" className="hover:text-soft-black transition-colors">Публичная оферта</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const Footer = memo(FooterComponent);
