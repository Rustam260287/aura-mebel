"use client";

import React from 'react';
import { CartProvider } from '../contexts/CartContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { ToastContainer } from './ToastContainer';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <CartProvider>
      <WishlistProvider>
        {children}
        <ToastContainer />
      </WishlistProvider>
    </CartProvider>
  );
}
