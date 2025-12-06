
'use client';

import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { ToastProvider } from '../contexts/ToastContext';
import { CartSidebar } from './CartSidebar';
import { ToastContainer } from './ToastContainer';
import dynamic from 'next/dynamic';
import React from 'react';
import { useRouter } from 'next/router'; // ИСПРАВЛЕНО: импорт для Pages Router
import type { View } from '../types';

const ChatWidget = dynamic(
  () => import('./ChatWidget').then(mod => mod.ChatWidget),
  {
    ssr: false,
    loading: () => null
  }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // ИСПРАВЛЕНО: функция теперь принимает объект View и правильно обрабатывает его
  const handleNavigate = (view: View) => {
    switch (view.page) {
      case 'home':
        router.push('/');
        break;
      case 'catalog':
        router.push('/products');
        break;
      case 'checkout':
        router.push('/checkout');
        break;
      case 'product':
        router.push(`/products/${view.productId}`);
        break;
      default:
        // Для других view, если они будут использоваться, можно добавить логику
        router.push('/');
        break;
    }
  };

  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <WishlistProvider>
            
            {children}

            <CartSidebar onNavigate={handleNavigate} />
            <ToastContainer />
            <ChatWidget />

          </WishlistProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
