
import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { About as AboutComponent } from '../components/About';
import { CartSidebar } from '../components/CartSidebar';
import { useRouter } from 'next/router';

export default function About() {
  const router = useRouter();

  return (
    <>
      <Header />
      <main className="flex-grow">
        <AboutComponent />
      </main>
      <Footer />
      <CartSidebar onNavigate={(view) => {
          if (view.page === 'checkout') router.push('/checkout');
          if (view.page === 'catalog') router.push('/products');
      }} />
    </>
  );
}
