"use client";

import React from 'react';
import { CartProvider } from '../contexts/CartContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { AiChatProvider } from '../contexts/AiChatContext';
import { ToastContainer } from './ToastContainer';

interface ClientProvidersProps {
  children: React.ReactNode;
  allProducts: any[];
  onSessionEnd: (messages: any[]) => void;
}

export function ClientProviders({ children, allProducts, onSessionEnd }: ClientProvidersProps) {
  return (
    <WishlistProvider>
      <CartProvider>
        <AiChatProvider allProducts={allProducts} onSessionEnd={onSessionEnd}>
          {children}
          <ToastContainer />
        </AiChatProvider>
      </CartProvider>
    </WishlistProvider>
  );
}
