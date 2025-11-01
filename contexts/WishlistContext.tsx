

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
// Fix: Corrected import path for Product type
import type { Product } from '../types';

interface WishlistContextType {
  wishlistItems: number[];
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<number[]>([]);

  const addToWishlist = useCallback((productId: number) => {
    setWishlistItems(prev => {
        if (prev.includes(productId)) return prev;
        return [...prev, productId];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: number) => {
    setWishlistItems(prev => prev.filter(id => id !== productId));
  }, []);

  const isInWishlist = useCallback((productId: number) => {
    return wishlistItems.includes(productId);
  }, [wishlistItems]);

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist, wishlistCount }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
