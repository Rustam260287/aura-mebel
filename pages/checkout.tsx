
import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CheckoutPage as CheckoutPageComponent } from '../components/CheckoutPage';
import { useRouter } from 'next/router';
import { View } from '../types';

export default function Checkout() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<{ page: 'checkout' } | { page: 'order-success', orderId: string }>({ page: 'checkout' });

  const handleNavigate = (view: View) => {
    if (view.page === 'order-success' && 'orderId' in view) {
        setCurrentView(view);
        window.scrollTo(0, 0);
    } else if (view.page === 'home') {
        router.push('/');
    } else if (view.page === 'catalog') {
        router.push('/products');
    }
  };

  return (
    <>
      <Header />
      <main className="flex-grow">
        <CheckoutPageComponent 
            view={currentView} 
            onNavigate={handleNavigate} 
        />
      </main>
      <Footer />
    </>
  );
}
