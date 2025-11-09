import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import type { Product } from '../types';

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  configuration?: Record<string, string>;
  configuredPrice: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, configuration?: Record<string, string>, quantity?: number) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  toggleCart: () => void;
  cartCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const removeFromCart = useCallback((cartId: string) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  }, []);

  const addToCart = useCallback((product: Product, configuration?: Record<string, string>, quantity: number = 1) => {
    const configStr = configuration ? JSON.stringify(Object.keys(configuration).sort().map(key => [key, configuration[key]])) : '';

    const existingItem = cartItems.find(item => {
        const itemConfigStr = item.configuration ? JSON.stringify(Object.keys(item.configuration).sort().map(key => [key, item.configuration![key]])) : '';
        return item.id === product.id && itemConfigStr === configStr;
    });

    if (existingItem) {
        setCartItems(
            currentCartItems => currentCartItems.map(item =>
                item.cartId === existingItem.cartId
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            )
        );
    } else {
        const newCartItem: CartItem = {
            ...product,
            cartId: `${product.id}-${Date.now()}`,
            quantity,
            configuration,
            configuredPrice: product.price,
        };
        setCartItems(prev => [...prev, newCartItem]);
    }
  }, [cartItems]);

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

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.configuredPrice * item.quantity, 0);
  }, [cartItems]);

  const contextValue = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    isCartOpen,
    toggleCart,
    cartCount,
    totalPrice,
    clearCart
  }), [cartItems, addToCart, removeFromCart, updateQuantity, isCartOpen, toggleCart, cartCount, totalPrice, clearCart]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};