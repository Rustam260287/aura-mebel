
'use client';

import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { ToastProvider } from '../contexts/ToastContext';
import { CartSidebar } from './CartSidebar';
import { ToastContainer } from './ToastContainer';
import dynamic from 'next/dynamic';
import React from 'react';

// Динамический импорт ChatWidget внутри клиентского компонента
const ChatWidget = dynamic(
  () => import('./ChatWidget').then(mod => mod.ChatWidget),
  {
    ssr: false,
    loading: () => null
  }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <WishlistProvider>
            
            {children}

            <CartSidebar />
            <ToastContainer />
            <ChatWidget />

          </WishlistProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
