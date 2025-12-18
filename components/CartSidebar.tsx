
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
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out" 
                onClick={toggleCart} 
            />
            
            <div 
                className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out translate-x-0"
                onClick={e => e.stopPropagation()}
            >
                <header className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <h2 className="text-xl font-serif font-bold text-brand-charcoal">Ваша корзина <span className="text-gray-400 font-sans font-normal text-sm ml-1">({cartCount})</span></h2>
                    <button onClick={toggleCart} className="p-2 -mr-2 text-gray-400 hover:text-brand-brown rounded-full hover:bg-gray-50 transition-colors">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </header>

                {cartItems.length > 0 && (
                    <div className="bg-[#FAF9F6] px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-brand-brown mb-2">
                            {remainingForFreeShipping > 0 ? (
                                <span>До бесплатной доставки: {remainingForFreeShipping.toLocaleString('ru-RU')} ₽</span>
                            ) : (
                                <span className="text-green-600 flex items-center gap-1"><TruckIcon className="w-4 h-4"/> Доставка бесплатно!</span>
                            )}
                            <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ease-out rounded-full ${remainingForFreeShipping > 0 ? 'bg-brand-brown' : 'bg-green-500'}`} 
                                style={{ width: `${progressPercent}%` }} 
                            />
                        </div>
                    </div>
                )}

                <div className="flex-grow overflow-y-auto p-6 bg-white scrollbar-hide">
                    {cartItems.length === 0 ? (
                        <div className="text-center h-full flex flex-col justify-center items-center space-y-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                <ShoppingCartIcon className="w-8 h-8" />
                            </div>
                            <p className="text-gray-500 font-medium">Ваша корзина пока пуста</p>
                            <Button variant="outline" onClick={toggleCart} className="mt-2">Начать покупки</Button>
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
                            <div className="flex justify-between items-center text-gray-500 text-sm">
                                <span>Товары ({cartCount})</span>
                                <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
                            </div>
                            <div className="flex justify-between items-center text-xl font-serif text-brand-charcoal pt-3 border-t border-gray-100">
                                <span className="font-bold">Итого</span>
                                <span className="font-bold">{totalPrice.toLocaleString('ru-RU')} ₽</span>
                            </div>
                        </div>
                        <Button 
                            className="w-full py-4 text-sm font-bold uppercase tracking-widest bg-brand-brown hover:bg-brand-charcoal text-white shadow-lg shadow-brand-brown/20 flex items-center justify-center gap-2 group" 
                            onClick={handleCheckout}
                        >
                            Оформить заказ
                            <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                        <p className="text-center text-[10px] text-gray-400 mt-3">
                            Налоги и доставка рассчитываются при оформлении
                        </p>
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
        <div className="flex gap-4 group">
            <div className="relative w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                <Image src={item.imageUrls[0]} alt={item.name} className="object-cover" fill sizes="96px" />
            </div>
            <div className="flex-grow flex flex-col justify-between py-0.5">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium text-brand-charcoal text-sm leading-snug line-clamp-2 pr-4">{item.name}</h3>
                        <button onClick={() => onRemove(item.cartId)} className="text-gray-300 hover:text-red-500 transition-colors -mt-1 -mr-1 p-1">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                    {item.configuration && (
                        <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                            {Object.values(item.configuration).join(', ')}
                        </div>
                    )}
                </div>
                
                <div className="flex items-end justify-between mt-2">
                     <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <button 
                            onClick={() => onUpdateQuantity(item.cartId, Math.max(1, item.quantity - 1))} 
                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-brand-brown hover:bg-white rounded transition-all disabled:opacity-30"
                            disabled={item.quantity <= 1}
                        >
                            <MinusIcon className="w-3 h-3"/>
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-brand-charcoal">{item.quantity}</span>
                        <button 
                            onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)} 
                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-brand-brown hover:bg-white rounded transition-all"
                        >
                            <PlusIcon className="w-3 h-3"/>
                        </button>
                    </div>
                    <span className="text-sm font-bold text-brand-charcoal font-serif">
                        {(item.configuredPrice * item.quantity).toLocaleString('ru-RU')} ₽
                    </span>
                </div>
            </div>
        </div>
    );
}

export const CartSidebar = memo(CartSidebarComponent);
