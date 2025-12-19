
"use client";

import React, { memo } from 'react';
import { CartItem, useCartState, useCartDispatch } from '../contexts/CartContext';
import type { View } from '../types';
import { Button } from './Button';
// Иконки, которые ТОЧНО есть в вашем файле
import { XMarkIcon, TrashIcon, PlusIcon, MinusIcon, ShoppingCartIcon } from './Icons'; 
// Иконки, которых НЕ БЫЛО, импортируем НАПРЯМУЮ
import { ArrowRightIcon, TruckIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { cn } from '../utils';

interface CartSidebarProps {
  onNavigate: (view: View) => void;
}

const FREE_SHIPPING_THRESHOLD = 150000;

const CartSidebarComponent: React.FC<CartSidebarProps> = ({ onNavigate }) => {
    const { isCartOpen, cartItems, cartCount, totalPrice } = useCartState();
    const { toggleCart, removeFromCart, updateQuantity } = useCartDispatch();

    const handleCheckout = () => {
        toggleCart();
        onNavigate({ page: 'checkout' });
    };

    if (!isCartOpen) return null;

    const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);
    const progressPercent = Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100);

    return (
        <div 
          className="fixed inset-0 z-[100]" 
          aria-label="Корзина покупок" 
        >
            <div 
                className="absolute inset-0 bg-brand-charcoal/20 backdrop-blur-sm transition-opacity duration-300 ease-in-out" 
                onClick={toggleCart} 
            />
            
            <div 
                className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out translate-x-0"
                onClick={e => e.stopPropagation()}
            >
                <header className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <h2 className="text-lg font-serif font-bold text-brand-charcoal">Корзина <span className="text-brand-terracotta text-sm ml-1 font-sans font-medium">({cartCount})</span></h2>
                    <button onClick={toggleCart} className="p-2 -mr-2 text-gray-400 hover:text-brand-terracotta rounded-full hover:bg-gray-50 transition-colors">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </header>

                {cartItems.length > 0 && (
                    <div className="bg-brand-cream-dark/50 px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/60 mb-2">
                            {remainingForFreeShipping > 0 ? (
                                <span>До бесплатной доставки: {remainingForFreeShipping.toLocaleString('ru-RU')} ₽</span>
                            ) : (
                                <span className="text-brand-terracotta flex items-center gap-1"><TruckIcon className="w-4 h-4"/> Доставка бесплатно!</span>
                            )}
                            <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className={cn(
                                    "h-full transition-all duration-500 ease-out rounded-full",
                                    remainingForFreeShipping > 0 ? 'bg-brand-charcoal' : 'bg-brand-terracotta'
                                )} 
                                style={{ width: `${progressPercent}%` }} 
                            />
                        </div>
                    </div>
                )}

                <div className="flex-grow overflow-y-auto p-6 bg-white scrollbar-hide">
                    {cartItems.length === 0 ? (
                        <div className="text-center h-full flex flex-col justify-center items-center space-y-4">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-2">
                                <ShoppingCartIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-serif text-brand-charcoal">Ваша корзина пуста</h3>
                            <p className="text-gray-500 font-light text-sm max-w-xs">Посмотрите наш каталог, там много интересного для вашего дома.</p>
                            <Button variant="outline" onClick={toggleCart} className="mt-4 border-brand-charcoal/20 hover:border-brand-charcoal">Перейти в каталог</Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cartItems.map(item => (
                                <CartSidebarItem key={item.cartId} item={item} onRemove={removeFromCart} onUpdateQuantity={updateQuantity}/>
                            ))}
                        </div>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <footer className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10">
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center text-brand-charcoal/60 text-sm">
                                <span>Товары ({cartCount})</span>
                                <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
                            </div>
                            <div className="flex justify-between items-center text-2xl font-serif text-brand-charcoal pt-4 border-t border-dashed border-gray-200">
                                <span>Итого</span>
                                <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
                            </div>
                        </div>
                        <Button 
                            className="w-full h-14 text-xs font-bold uppercase tracking-[0.2em] bg-brand-charcoal hover:bg-brand-brown text-white shadow-xl shadow-brand-charcoal/10 flex items-center justify-center gap-3 group" 
                            onClick={handleCheckout}
                        >
                            Оформить заказ
                            <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </footer>
                )}
            </div>
        </div>
    );
};

interface CartSidebarItemProps {
    item: CartItem;
    onRemove: (cartId: string) => void;
    onUpdateQuantity: (cartId: string, quantity: number) => void;
}

const CartSidebarItem: React.FC<CartSidebarItemProps> = ({ item, onRemove, onUpdateQuantity }) => {
    return (
        <div className="flex gap-5 group">
            <div className="relative w-24 h-24 flex-shrink-0 bg-gray-50 rounded-sm overflow-hidden shadow-sm">
                <Image src={item.imageUrls[0]} alt={item.name} className="object-cover" fill sizes="96px" />
            </div>
            <div className="flex-grow flex flex-col justify-between py-0.5">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium text-brand-charcoal text-sm leading-relaxed line-clamp-2 pr-2">{item.name}</h3>
                        <button onClick={() => onRemove(item.cartId)} className="text-gray-300 hover:text-brand-terracotta transition-colors -mt-1 -mr-1 p-1">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                    {item.configuration && (
                        <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">
                            {Object.values(item.configuration).join(', ')}
                        </div>
                    )}
                </div>
                
                <div className="flex items-end justify-between mt-2">
                     <div className="flex items-center bg-gray-50 rounded p-0.5 border border-gray-100">
                        <button 
                            onClick={() => onUpdateQuantity(item.cartId, Math.max(1, item.quantity - 1))} 
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-brand-charcoal hover:bg-white rounded-sm transition-all disabled:opacity-30"
                            disabled={item.quantity <= 1}
                        >
                            <MinusIcon className="w-3 h-3"/>
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-brand-charcoal">{item.quantity}</span>
                        <button 
                            onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)} 
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-brand-charcoal hover:bg-white rounded-sm transition-all"
                        >
                            <PlusIcon className="w-3 h-3"/>
                        </button>
                    </div>
                    <span className="text-base font-medium text-brand-charcoal">
                        {(item.configuredPrice * item.quantity).toLocaleString('ru-RU')} ₽
                    </span>
                </div>
            </div>
        </div>
    );
}

export const CartSidebar = memo(CartSidebarComponent);
