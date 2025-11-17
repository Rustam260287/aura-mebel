"use client";

import React from 'react';
import { CartProvider } from '../contexts/CartContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { AiChatProvider, ChatMessage } from '../contexts/AiChatContext';
import { ToastContainer } from './ToastContainer';
import { Product } from '../types';

interface ClientProvidersProps {
  children: React.ReactNode;
  allProducts: Product[];
  onSessionEnd: (messages: ChatMessage[]) => void;
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
