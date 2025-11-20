
import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { WishlistPage as WishlistPageComponent } from '../components/WishlistPage';
import { CartSidebar } from '../components/CartSidebar';
import { useRouter } from 'next/router';

export default function Wishlist() {
  const router = useRouter();

  return (
    <>
      <Header />
      <main className="flex-grow">
        <WishlistPageComponent onNavigate={(view) => {
             if (view.page === 'product' && 'productId' in view) {
                 router.push(`/products/${view.productId}`);
             }
        }}/>
      </main>
      <Footer />
      <CartSidebar onNavigate={(view) => {
          if (view.page === 'checkout') router.push('/checkout');
          if (view.page === 'catalog') router.push('/products');
      }} />
    </>
  );
}
