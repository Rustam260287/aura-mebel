import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import type { Product } from '../types';

export interface CartItem extends Product {
  quantity: number;
  cartId: string; // Unique ID for this item instance in the cart
  configuration?: Record<string, string>;
  configuredPrice: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, configuration?: Record<string, string>, quantity?: number) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  isCartOpen: boolean;
  toggleCart: () => void;
  cartCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleCart = useCallback(() => {
    setIsCartOpen(prev => !prev);
  }, []);

  const addToCart = useCallback((product: Product, configuration?: Record<string, string>, quantity = 1) => {
    setCartItems(prevItems => {
      // Create a unique ID for the cart item based on product ID and configuration
      const configString = configuration ? Object.entries(configuration).sort().map(([key, value]) => `${key}:${value}`).join('-') : '';
      const cartId = `${product.id}-${configString}`;

      const existingItem = prevItems.find(item => item.cartId === cartId);

      if (existingItem) {
        // If item with same config exists, update quantity
        return prevItems.map(item =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Otherwise, add new item
        const newItem: CartItem = {
          ...product,
          quantity,
          configuration,
          cartId,
          configuredPrice: product.price, // Price does not change with configuration in this version.
        };
        return [...prevItems, newItem];
      }
    });
    // Open cart sidebar when item is added
    if (!isCartOpen) {
        setIsCartOpen(true);
    }
  }, [isCartOpen]);

  const removeFromCart = useCallback((cartId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.cartId !== cartId));
  }, []);

  const updateQuantity = useCallback((cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.cartId === cartId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.configuredPrice * item.quantity, 0);
  }, [cartItems]);
  
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    isCartOpen,
    toggleCart,
    cartCount,
    totalPrice
  };

  return (
    <CartContext.Provider value={value}>
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
