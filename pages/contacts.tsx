
      import React from 'react';
      import { Header } from '../components/Header';
      import { Footer } from '../components/Footer';
      import { Contacts as ContactsComponent } from '../components/Contacts';
      import { CartSidebar } from '../components/CartSidebar';
      import { useRouter } from 'next/router';
      import type { View } from '../types';
      import { SEO } from '../components/SEO';

      export default function Contacts() {
        const router = useRouter();
      
        const handleNavigate = (view: View) => {
            if (view.page === 'checkout') {
                router.push('/checkout');
            } else if (view.page === 'catalog') {
                router.push('/products');
            } else if (view.page === 'product' && 'productId' in view) {
                router.push(`/products/${view.productId}`);
            }
        };
      
        return (
          <>
            <SEO title="Контакты" description="Адреса наших шоурумов и способы связи. Мы всегда рады помочь вам с выбором." />
            <Header />
            <main className="flex-grow">
              <ContactsComponent />
            </main>
            <Footer />
            <CartSidebar onNavigate={handleNavigate} />
          </>
        );
      }
      