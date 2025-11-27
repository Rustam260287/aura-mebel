
"use client";

import React from 'react';
import { useRouter } from 'next/router'; // Нужен для навигации из корзины
import { CartProvider } from '../contexts/CartContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { ToastContainer } from './ToastContainer';
import { CartSidebar } from './CartSidebar'; // Импортируем напрямую

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  const router = useRouter();

  return (
    <CartProvider>
      <WishlistProvider>
        {children}
        {/* Глобальные компоненты, которые должны быть на всех страницах */}
        <ToastContainer />
        <CartSidebar onNavigate={(view) => router.push(`/${view.page}`)} />
      </WishlistProvider>
    </CartProvider>
  );
}
