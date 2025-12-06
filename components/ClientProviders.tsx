
'use client';

import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { ToastProvider } from '../contexts/ToastContext';
import { CartSidebar } from './CartSidebar';
import { ToastContainer } from './ToastContainer';
import dynamic from 'next/dynamic';
import React from 'react';
import { useRouter } from 'next/navigation'; // Используем next/navigation для App Router

const ChatWidget = dynamic(
  () => import('./ChatWidget').then(mod => mod.ChatWidget),
  {
    ssr: false,
    loading: () => null
  }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Функция для навигации, которую ожидает CartSidebar
  const handleNavigate = (path: string) => {
    router.push(path);
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
