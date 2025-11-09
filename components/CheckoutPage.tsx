import React, { useState, memo } from 'react';
import type { View } from '../types';
import { useCart } from '../contexts/CartContext';
import { Button } from './Button';
import { CheckCircleIcon } from './Icons';

interface CheckoutPageProps {
  view: { page: 'checkout' } | { page: 'order-success', orderId: string };
  onNavigate: (view: View) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = memo(({ view, onNavigate }) => {
  const { cartItems, totalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    comments: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const fakeOrderId = Math.random().toString(36).substring(2, 10).toUpperCase();
    console.log('Order Submitted:', {
      orderId: fakeOrderId,
      customer: formData,
      items: cartItems,
      total: totalPrice,
    });

    clearCart();
    onNavigate({ page: 'order-success', orderId: fakeOrderId });
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

        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-serif text-brand-charcoal mb-6">Ваш заказ</h2>
          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.cartId} className="flex items-center gap-4 border-b pb-4">
                <img src={item.imageUrls[0]} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                <div className="flex-grow">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    {item.quantity} x {item.configuredPrice.toLocaleString('ru-RU')} ₽
                  </p>
                  {item.category === 'Кастом' && (
                      <p className="text-xs text-brand-terracotta mt-1 p-1 bg-amber-50 rounded">
                        <strong>Кастомный товар:</strong> менеджер свяжется с вами для подтверждения.
                      </p>
                  )}
                </div>
                <div className="font-semibold text-brand-charcoal">
                  {(item.quantity * item.configuredPrice).toLocaleString('ru-RU')} ₽
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-baseline text-xl">
              <span className="font-semibold">Итого:</span>
              <span className="font-serif text-3xl text-brand-brown">{totalPrice.toLocaleString('ru-RU')} ₽</span>
            </div>
            <Button size="lg" type="submit" className="w-full mt-6">
              Подтвердить заказ
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
});