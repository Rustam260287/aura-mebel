


import React from 'react';
import { useCart, CartItem } from '../contexts/CartContext';
import { Button } from './Button';
import { XMarkIcon, TrashIcon, PlusIcon, MinusIcon } from './Icons';

export const CartSidebar: React.FC = () => {
    const { isCartOpen, toggleCart, cartItems, removeFromCart, updateQuantity, cartCount, totalPrice } = useCart();

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 animate-subtle-fade-in" onClick={toggleCart}>
            <div 
                className="fixed top-0 right-0 h-full w-full max-w-md bg-brand-cream shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-6 border-b border-brand-cream-dark">
                    <h2 className="text-2xl font-serif text-brand-brown">Корзина ({cartCount})</h2>
                    <Button variant="ghost" onClick={toggleCart} className="p-2 -mr-2">
                        <XMarkIcon className="w-6 h-6"/>
                    </Button>
                </header>

                <div className="flex-grow overflow-y-auto p-6">
                    {cartItems.length === 0 ? (
                        <div className="text-center text-brand-charcoal h-full flex flex-col justify-center">
                            <p className="text-lg">Ваша корзина пуста.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cartItems.map(item => (
                                <CartSidebarItem key={item.cartId} item={item} onRemove={removeFromCart} onUpdateQuantity={updateQuantity}/>
                            ))}
                        </div>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <footer className="p-6 border-t border-brand-cream-dark bg-white">
                        <div className="flex justify-between items-center mb-4 text-lg">
                            <span className="font-semibold text-brand-charcoal">Итого:</span>
                            <span className="font-serif text-brand-brown">{totalPrice.toLocaleString('ru-RU')} ₽</span>
                        </div>
                        <Button size="lg" className="w-full">
                            Оформить заказ
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
        <div className="flex gap-4">
            <img src={item.imageUrls[0]} alt={item.name} className="w-24 h-24 object-cover rounded-md" loading="lazy"/>
            <div className="flex-grow flex flex-col justify-between">
                <div>
                    <h3 className="font-semibold text-brand-charcoal">{item.name}</h3>
                    {item.configuration && (
                        <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                            {Object.entries(item.configuration).map(([key, value]) => (
                                <div key={key}>
                                    <span className="font-medium">{item.configurationOptions?.find(opt => opt.id === key)?.name}:</span> {value}
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-brand-brown font-serif mt-1">{item.configuredPrice.toLocaleString('ru-RU')} ₽</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                     <div className="flex items-center border border-gray-300 rounded-md">
                        <button onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)} className="p-1.5 hover:bg-gray-100 rounded-l-md"><MinusIcon className="w-4 h-4"/></button>
                        <span className="px-3 text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)} className="p-1.5 hover:bg-gray-100 rounded-r-md"><PlusIcon className="w-4 h-4"/></button>
                    </div>
                    <button onClick={() => onRemove(item.cartId)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
}