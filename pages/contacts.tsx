
      import React from 'react';
      import { Header } from '../components/Header';
      import { Footer } from '../components/Footer';
      import { Contacts as ContactsComponent } from '../components/Contacts';
      import { CartSidebar } from '../components/CartSidebar';
      import { useRouter } from 'next/router';
      import type { View } from '../types';

      export default function Contacts() {
        const router = useRouter();
      
        const handleNavigate = (view: View) => {
            if (view.page === 'checkout') {
                router.push('/checkout');
            }
            if (view.page === 'catalog') {
                router.push('/products');
            }
        };

        return (
          <>
            <Header />
            <main className="flex-grow">
              <ContactsComponent />
            </main>
            <Footer />
            <CartSidebar onNavigate={handleNavigate} />
          </>
        );
      }
      