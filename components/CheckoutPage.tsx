
import React, { useState, memo, useMemo } from 'react';
import type { View } from '../types';
import { useCartState, useCartDispatch } from '../contexts/CartContext';
import { Button } from './Button';
import { CheckCircleIcon, SparklesIcon } from './icons';
import Image from 'next/image';
import { useToast } from '../contexts/ToastContext';
import Link from 'next/link';

interface CheckoutPageProps {
  view: { page: 'checkout' } | { page: 'order-success', orderId: string };
  onNavigate: (view: View) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = memo(({ view, onNavigate }) => {
  const { cartItems, totalPrice } = useCartState();
  const { clearCart } = useCartDispatch();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    comments: '',
  });

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);

  const finalTotal = useMemo(() => {
      if (appliedPromo) {
          return Math.round(totalPrice * (1 - appliedPromo.discountPercent / 100));
      }
      return totalPrice;
  }, [totalPrice, appliedPromo]);

  const handleApplyPromo = () => {
      if (promoCode.toUpperCase() === 'LABELCOM5') {
          setAppliedPromo({ code: 'LABELCOM5', discountPercent: 5 });
          addToast('Промокод применен! Скидка 5%', 'success');
      } else {
          addToast('Неверный промокод', 'error');
          setAppliedPromo(null);
      }
  };

  const handleRemovePromo = () => {
      setAppliedPromo(null);
      setPromoCode('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
        addToast('Необходимо согласие на обработку персональных данных', 'error');
        return;
    }
    setIsSubmitting(true);

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer: formData,
                items: cartItems,
                subtotal: totalPrice,
                discount: totalPrice - finalTotal,
                promoCode: appliedPromo?.code,
                total: finalTotal,
            }),
        });

        if (!res.ok) {
            throw new Error('Failed to place order');
        }

        const data = await res.json();
        const orderId = data.id;

        clearCart();
        onNavigate({ page: 'order-success', orderId });
    } catch (error) {
        console.error('Order error:', error);
        addToast('Не удалось оформить заказ. Пожалуйста, попробуйте позже.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (view.page === 'order-success') {
    return (
        <div className="container mx-auto px-6 py-24 text-center min-h-[60vh] flex flex-col items-center justify-center bg-brand-cream-dark">
            <div className="max-w-xl w-full bg-white p-12 rounded-lg shadow-xl animate-fade-in-up border border-brand-charcoal/5">
                <div className="w-20 h-20 bg-brand-cream-dark rounded-full flex items-center justify-center mx-auto mb-8 animate-pop">
                    <CheckCircleIcon className="w-10 h-10 text-brand-terracotta" />
                </div>
                <h1 className="text-3xl md:text-4xl font-serif text-brand-charcoal mb-4">Заказ принят</h1>
                <p className="text-brand-charcoal/70 mb-2">Номер вашего заказа: <strong className="text-brand-terracotta font-serif text-xl">#{view.orderId}</strong></p>
                <p className="text-sm text-gray-500 font-light mb-10 max-w-sm mx-auto">Наш менеджер уже получил уведомление и свяжется с вами в течение 15 минут для уточнения деталей.</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                        size="lg" 
                        onClick={() => onNavigate({ page: 'catalog' })}
                        className="bg-brand-charcoal hover:bg-brand-brown text-white shadow-xl shadow-brand-charcoal/10"
                    >
                        Вернуться в каталог
                    </Button>
                </div>
            </div>
        </div>
    )
  }

  if (cartItems.length === 0) {
      return (
          <div className="container mx-auto px-6 py-24 text-center min-h-[60vh] flex flex-col items-center justify-center bg-brand-cream-dark">
              <h1 className="text-4xl font-serif text-brand-charcoal mb-4">Ваша корзина пуста</h1>
              <p className="text-lg text-brand-charcoal/60 font-light mb-8">Вы не можете оформить заказ, так как в корзине нет товаров.</p>
              <Button size="lg" className="px-12 bg-brand-charcoal hover:bg-brand-brown shadow-lg" onClick={() => onNavigate({ page: 'catalog' })}>
                  Перейти в каталог
              </Button>
          </div>
      );
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-16 md:py-24">
      <div className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-serif text-brand-charcoal mb-12 text-center md:text-left">Оформление заказа</h1>
        
        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white p-8 md:p-10 rounded-sm shadow-xl border-t-4 border-brand-charcoal">
                <h2 className="text-2xl font-serif text-brand-charcoal mb-8 pb-4 border-b border-gray-100">Контактные данные</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="md:col-span-2">
                        <label htmlFor="name" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">ФИО Получателя</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required 
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded focus:bg-white focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown transition-colors" 
                            placeholder="Иванов Иван Иванович"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Телефон</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required 
                             className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded focus:bg-white focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown transition-colors"
                             placeholder="+7 (___) ___-__-__"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required 
                             className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded focus:bg-white focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown transition-colors"
                             placeholder="example@mail.com"
                        />
                    </div>
                </div>
                
                <div className="space-y-6">
                     <div>
                        <label htmlFor="address" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Адрес доставки</label>
                        <textarea id="address" name="address" rows={3} value={formData.address} onChange={handleInputChange} required 
                             className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded focus:bg-white focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown transition-colors resize-none"
                             placeholder="Город, улица, дом, квартира, подъезд, этаж"
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="comments" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Комментарий к заказу</label>
                        <textarea id="comments" name="comments" rows={3} value={formData.comments} onChange={handleInputChange} 
                             className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded focus:bg-white focus:border-brand-brown focus:outline-none focus:ring-1 focus:ring-brand-brown transition-colors resize-none"
                             placeholder="Например: код домофона, удобное время доставки..."
                        ></textarea>
                    </div>
                </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 relative">
             <div className="bg-white p-8 md:p-10 rounded-sm shadow-xl sticky top-24 border-t-4 border-brand-terracotta">
                <h2 className="text-2xl font-serif text-brand-charcoal mb-6">Ваш заказ</h2>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mb-8">
                    {cartItems.map(item => (
                    <div key={item.cartId} className="flex gap-4 py-4 border-b border-dashed border-gray-100 last:border-0">
                        <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded overflow-hidden">
                            <Image src={item.imageUrls[0]} alt={item.name} className="object-cover" fill sizes="64px" />
                        </div>
                        <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5">
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="font-medium text-sm text-brand-charcoal leading-snug line-clamp-2">{item.name}</h3>
                                <span className="font-bold text-sm text-brand-charcoal whitespace-nowrap">{(item.quantity * item.configuredPrice).toLocaleString('ru-RU')} ₽</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <p className="text-xs text-gray-400">
                                    {item.quantity} шт x {item.configuredPrice.toLocaleString('ru-RU')} ₽
                                </p>
                                {item.category === 'Custom' && (
                                    <span className="text-[10px] text-brand-terracotta font-bold uppercase tracking-wide bg-brand-terracotta/10 px-1.5 py-0.5 rounded">Custom</span>
                                )}
                            </div>
                        </div>
                    </div>
                    ))}
                </div>

                {/* Promo Code Section */}
                <div className="mb-8">
                    {!appliedPromo ? (
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Есть промокод?" 
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                                className="w-full border-b border-gray-300 py-2 pr-20 text-sm focus:outline-none focus:border-brand-brown bg-transparent placeholder:text-gray-400"
                            />
                            <button 
                                type="button"
                                onClick={handleApplyPromo} 
                                disabled={!promoCode}
                                className="absolute right-0 bottom-2 text-xs font-bold uppercase tracking-widest text-brand-brown hover:text-brand-charcoal disabled:opacity-30 transition-colors"
                            >
                                Применить
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center bg-brand-cream/50 p-3 rounded border border-brand-brown/20">
                            <div className="flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-brand-terracotta" />
                                <span className="text-brand-charcoal text-sm font-medium">Промокод {appliedPromo.code} (-{appliedPromo.discountPercent}%)</span>
                            </div>
                            <button onClick={handleRemovePromo} className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                        </div>
                    )}
                </div>

                <div className="space-y-3 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center text-gray-500 text-sm">
                        <span>Сумма заказа</span>
                        <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    {appliedPromo && (
                        <div className="flex justify-between items-center text-brand-terracotta text-sm">
                            <span>Скидка</span>
                            <span>-{(totalPrice - finalTotal).toLocaleString('ru-RU')} ₽</span>
                        </div>
                    )}
                    <div className="flex justify-between items-baseline pt-4 mt-2 border-t border-brand-charcoal/10">
                        <span className="text-xl font-serif text-brand-charcoal">Итого к оплате</span>
                        <span className="text-3xl font-serif font-bold text-brand-brown">{finalTotal.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    
                    <div className="mt-8 mb-6">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={agreed} 
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow transition-all checked:border-brand-brown checked:bg-brand-brown hover:shadow-md"
                                />
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                </span>
                            </div>
                            <span className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                                Я подтверждаю заказ и соглашаюсь с <Link href="/terms" className="text-brand-brown hover:underline" target="_blank">условиями оферты</Link> и <Link href="/privacy" className="text-brand-brown hover:underline" target="_blank">политикой конфиденциальности</Link>.
                            </span>
                        </label>
                    </div>

                    <Button 
                        size="lg" 
                        type="submit" 
                        disabled={isSubmitting || !agreed} 
                        className="w-full bg-brand-charcoal hover:bg-brand-brown text-white shadow-xl shadow-brand-charcoal/20 py-4 h-auto text-sm font-bold uppercase tracking-widest"
                    >
                        {isSubmitting ? 'Обработка...' : 'Подтвердить заказ'}
                    </Button>
                </div>
             </div>
          </div>

        </form>
      </div>
    </div>
  );
});

CheckoutPage.displayName = 'CheckoutPage';
