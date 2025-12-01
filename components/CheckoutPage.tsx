
import React, { useState, memo, useMemo } from 'react';
import type { View } from '../types';
import { useCartState, useCartDispatch } from '../contexts/CartContext';
import { Button } from './Button';
import { CheckCircleIcon, SparklesIcon } from './Icons';
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

  // Promo Code State
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
        <div className="container mx-auto px-6 py-12 text-center">
            <div className="max-w-2xl mx-auto bg-white p-12 rounded-lg shadow-lg animate-scale-in">
                <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h1 className="text-4xl font-serif text-brand-brown mb-4">Спасибо за ваш заказ!</h1>
                <p className="text-lg text-brand-charcoal">Ваш заказ <strong className="text-brand-brown">№{view.orderId}</strong> успешно оформлен.</p>
                <p className="text-brand-charcoal/80 mt-2">Мы свяжемся с вами в ближайшее время для подтверждения деталей.</p>
                <Button size="lg" className="mt-8" onClick={() => onNavigate({ page: 'home' })}>
                    Вернуться на главную
                </Button>
            </div>
        </div>
    )
  }

  if (cartItems.length === 0) {
      return (
          <div className="container mx-auto px-6 py-12 text-center">
              <h1 className="text-4xl font-serif text-brand-brown mb-4">Ваша корзина пуста</h1>
              <p className="text-lg text-brand-charcoal">Вы не можете оформить заказ, так как в корзине нет товаров.</p>
              <Button size="lg" className="mt-8" onClick={() => onNavigate({ page: 'catalog' })}>
                  Перейти в каталог
              </Button>
          </div>
      );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif text-brand-brown mb-3">Оформление заказа</h1>
      </div>
      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-serif text-brand-charcoal mb-6">Ваши данные</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">ФИО</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Телефон</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown" />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Адрес доставки</label>
              <textarea id="address" name="address" rows={3} value={formData.address} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown"></textarea>
            </div>
            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700">Комментарий к заказу</label>
              <textarea id="comments" name="comments" rows={3} value={formData.comments} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown"></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg h-fit">
          <h2 className="text-2xl font-serif text-brand-charcoal mb-6">Ваш заказ</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {cartItems.map(item => (
              <div key={item.cartId} className="flex items-center gap-4 border-b pb-4">
                <Image src={item.imageUrls[0]} alt={item.name} className="w-20 h-20 object-cover rounded-md flex-shrink-0" width={80} height={80} />
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold truncate">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    {item.quantity} x {item.configuredPrice.toLocaleString('ru-RU')} ₽
                  </p>
                  {item.category === 'Custom' && (
                      <p className="text-xs text-brand-terracotta mt-1 p-1 bg-amber-50 rounded">
                        <strong>Кастомный товар</strong>
                      </p>
                  )}
                </div>
                <div className="font-semibold text-brand-charcoal whitespace-nowrap">
                  {(item.quantity * item.configuredPrice).toLocaleString('ru-RU')} ₽
                </div>
              </div>
            ))}
          </div>

          {/* Promo Code Section */}
          <div className="mt-6 pt-4 border-t">
              {!appliedPromo ? (
                  <div className="flex gap-2">
                      <input 
                          type="text" 
                          placeholder="Промокод" 
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-grow border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-brand-brown"
                      />
                      <Button variant="outline" size="sm" onClick={handleApplyPromo} disabled={!promoCode}>
                          Применить
                      </Button>
                  </div>
              ) : (
                  <div className="flex justify-between items-center bg-green-50 p-3 rounded-md border border-green-200">
                      <div className="flex items-center gap-2">
                          <SparklesIcon className="w-5 h-5 text-green-600" />
                          <span className="text-green-800 text-sm font-medium">Промокод {appliedPromo.code} (-{appliedPromo.discountPercent}%)</span>
                      </div>
                      <button onClick={handleRemovePromo} className="text-gray-400 hover:text-red-500 text-sm">✕</button>
                  </div>
              )}
          </div>

          <div className="mt-6 pt-6 border-t space-y-2">
            <div className="flex justify-between items-baseline text-gray-600">
              <span>Сумма:</span>
              <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
            </div>
            {appliedPromo && (
                <div className="flex justify-between items-baseline text-green-600 font-medium">
                    <span>Скидка:</span>
                    <span>-{(totalPrice - finalTotal).toLocaleString('ru-RU')} ₽</span>
                </div>
            )}
            <div className="flex justify-between items-baseline text-xl mt-2 pt-2 border-t border-dashed">
              <span className="font-semibold">Итого:</span>
              <span className="font-serif text-3xl text-brand-brown">{finalTotal.toLocaleString('ru-RU')} ₽</span>
            </div>
            
            <div className="mt-6 mb-4">
                <label className="flex items-start gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={agreed} 
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 h-4 w-4 text-brand-brown border-gray-300 rounded focus:ring-brand-brown"
                    />
                    <span className="text-sm text-gray-600">
                        Я подтверждаю заказ и соглашаюсь с условиями <Link href="/terms" className="text-brand-brown underline hover:no-underline" target="_blank">Публичной оферты</Link> и <Link href="/privacy" className="text-brand-brown underline hover:no-underline" target="_blank">Политикой обработки персональных данных</Link>.
                    </span>
                </label>
            </div>

            <Button size="lg" type="submit" disabled={isSubmitting || !agreed} className="w-full">
              {isSubmitting ? 'Оформление...' : 'Подтвердить заказ'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
});

CheckoutPage.displayName = 'CheckoutPage';
