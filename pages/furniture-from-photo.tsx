
import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FurnitureFromPhotoPage } from '../components/FurnitureFromPhotoPage';
import { CartSidebar } from '../components/CartSidebar';
import { useRouter } from 'next/router';

export default function FurnitureFromPhoto() {
  const router = useRouter();
  
  return (
    <>
      <Header />
      <main className="flex-grow">
        <FurnitureFromPhotoPage />
      </main>
      <Footer />
      <CartSidebar onNavigate={(view) => {
          if (view.page === 'catalog') router.push('/products');
          if (view.page === 'checkout') router.push('/checkout');
          // Add other navigations as needed
      }} />
    </>
  );
}
