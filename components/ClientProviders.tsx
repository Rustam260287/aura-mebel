
"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { ToastProvider } from '../contexts/ToastContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { ToastContainer } from './ToastContainer';
import { ChatWidget } from './ChatWidget';
import { useProductModals } from '../hooks/useProductModals';
import { FloatingMenuButton } from './FloatingMenuButton';
import { MobileMenuOverlay } from './MobileMenuOverlay';
import { ImmersiveProvider, useImmersive } from '../contexts/ImmersiveContext';

const QuickViewModal = dynamic(() => import('./QuickViewModal').then(mod => mod.QuickViewModal), { ssr: false });
const ImageZoomModal = dynamic(() => import('./ImageZoomModal').then(mod => mod.ImageZoomModal), { ssr: false });

const MobileMenuChrome: React.FC = () => {
  const router = useRouter();
  const { isImmersive } = useImmersive();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateIsMobile = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches);
    };
    updateIsMobile();

    mediaQuery.addEventListener('change', updateIsMobile);

    return () => {
      mediaQuery.removeEventListener('change', updateIsMobile);
    };
  }, []);

  useEffect(() => {
    if (isImmersive) setOpen(false);
  }, [isImmersive]);

  useEffect(() => {
    const handleRouteChangeStart = () => setOpen(false);
    router.events.on('routeChangeStart', handleRouteChangeStart);
    return () => router.events.off('routeChangeStart', handleRouteChangeStart);
  }, [router.events]);

  const isVisible = isMobile && !isImmersive;

  if (!isVisible) return null;

  return (
    <>
      {!open && <FloatingMenuButton onClick={() => setOpen(true)} />}
      <MobileMenuOverlay
        open={open}
        onClose={() => setOpen(false)}
        onCatalog={() => {
          setOpen(false);
          router.push('/products');
        }}
        onWishlist={() => {
          setOpen(false);
          router.push('/wishlist');
        }}
        onAbout={() => {
          setOpen(false);
          router.push('/about');
        }}
      />
    </>
  );
};

export const ClientProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  const {
    quickViewProduct,
    closeQuickView,
    imageModalState,
    closeImageModal,
  } = useProductModals();
  const router = useRouter();
  
  useEffect(() => {
    // This is a workaround for iOS Safari's viewport height issue.
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  return (
    <ImmersiveProvider>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
              <ToastContainer />
              <ChatWidget />
              <MobileMenuChrome />
              {quickViewProduct && <QuickViewModal 
                  product={quickViewProduct} 
                  onClose={closeQuickView}
                  onViewDetails={(id) => router.push(`/products/${id}`)}
              />}
              <ImageZoomModal {...imageModalState} onClose={closeImageModal} />
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </ImmersiveProvider>
  );
};
