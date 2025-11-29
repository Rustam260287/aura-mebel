"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface WishlistContextType {
  wishlistItems: string[];
  addToWishlist: (id: string) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem('aura_wishlist');
      if (item) {
        setWishlistItems(JSON.parse(item));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        window.localStorage.setItem('aura_wishlist', JSON.stringify(wishlistItems));
      } catch (error) {
        console.error(error);
      }
    }
  }, [wishlistItems, isLoaded]);


  const addToWishlist = useCallback((id: string) => {
    setWishlistItems(prev => [...new Set([...prev, id])]);
  }, []);

  const removeFromWishlist = useCallback((id: string) => {
    setWishlistItems(prev => prev.filter(itemId => itemId !== id));
  }, []);

  const isInWishlist = useCallback((id: string) => {
    return wishlistItems.includes(id);
  }, [wishlistItems]);

  const wishlistCount = wishlistItems.length;

  const contextValue = useMemo(() => ({
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    wishlistCount
  }), [wishlistItems, addToWishlist, removeFromWishlist, isInWishlist, wishlistCount]);

  return (
    <WishlistContext.Provider value={contextValue}>
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
