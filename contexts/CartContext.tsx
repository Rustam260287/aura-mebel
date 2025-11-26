
"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import type { Product } from '../types';

// Типы остаются прежними
export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  configuration?: Record<string, string>;
  configuredPrice: number;
}

// РАЗДЕЛЕНИЕ КОНТЕКСТОВ
interface CartStateContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  cartCount: number;
  totalPrice: number;
}

interface CartDispatchContextType {
  addToCart: (product: Product, configuration?: Record<string, string>, quantity?: number) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
}

// Создаем два отдельных контекста
const CartStateContext = createContext<CartStateContextType | undefined>(undefined);
const CartDispatchContext = createContext<CartDispatchContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Функции (диспатчи) - они стабильны
  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);
  const clearCart = useCallback(() => setCartItems([]), []);
  const removeFromCart = useCallback((cartId: string) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  }, []);

  const addToCart = useCallback((product: Product, configuration?: Record<string, string>, quantity: number = 1) => {
    setCartItems(currentCartItems => {
        const configStr = configuration ? JSON.stringify(Object.keys(configuration).sort().map(key => [key, configuration[key]])) : '';
        const existingItem = currentCartItems.find(item => {
            const itemConfigStr = item.configuration ? JSON.stringify(Object.keys(item.configuration).sort().map(key => [key, item.configuration![key]])) : '';
            return item.id === product.id && itemConfigStr === configStr;
        });

        if (existingItem) {
            return currentCartItems.map(item =>
                item.cartId === existingItem.cartId
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            );
        } else {
            const newCartItem: CartItem = {
                ...product,
                cartId: `${product.id}-${Date.now()}`,
                quantity,
                configuration,
                configuredPrice: product.price,
            };
            return [...currentCartItems, newCartItem];
        }
    });
  }, []);
  
  const updateQuantity = useCallback((cartId: string, quantity: number) => {
    if (quantity <= 0) {
        removeFromCart(cartId);
    } else {
        setCartItems(prev =>
            prev.map(item =>
                item.cartId === cartId ? { ...item, quantity } : item
            )
        );
    }
  }, [removeFromCart]);
  
  // Вычисляемые значения (состояние)
  const cartCount = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [cartItems]);
  const totalPrice = useMemo(() => cartItems.reduce((total, item) => total + item.configuredPrice * item.quantity, 0), [cartItems]);

  // Упаковываем в два отдельных useMemo
  const stateValue = useMemo(() => ({
    cartItems,
    isCartOpen,
    cartCount,
    totalPrice,
  }), [cartItems, isCartOpen, cartCount, totalPrice]);

  const dispatchValue = useMemo(() => ({
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleCart,
    clearCart,
  }), [addToCart, removeFromCart, updateQuantity, toggleCart, clearCart]);

  return (
    <CartStateContext.Provider value={stateValue}>
      <CartDispatchContext.Provider value={dispatchValue}>
        {children}
      </CartDispatchContext.Provider>
    </CartStateContext.Provider>
  );
};

// Создаем два отдельных хука для доступа
export const useCartState = () => {
  const context = useContext(CartStateContext);
  if (context === undefined) {
    throw new Error('useCartState must be used within a CartProvider');
  }
  return context;
};

export const useCartDispatch = () => {
  const context = useContext(CartDispatchContext);
  if (context === undefined) {
    throw new Error('useCartDispatch must be used within a CartProvider');
  }
  return context;
};
