
import React from 'react';
import { GetStaticProps } from 'next';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { WishlistPage as WishlistPageComponent } from '../components/WishlistPage';
import { CartSidebar } from '../components/CartSidebar';
import { useRouter } from 'next/router';
import { getAdminDb } from '../lib/firebaseAdmin';
import type { Product, View } from '../types';

interface WishlistPageProps {
  allProducts: Product[];
}

export default function Wishlist({ allProducts }: WishlistPageProps) {
  const router = useRouter();

  return (
    <>
      <Header />
      <main className="flex-grow">
        <WishlistPageComponent 
            allProducts={allProducts}
            onNavigate={(view: View) => {
                 if (view.page === 'product' && 'productId' in view) {
                     router.push(`/products/${view.productId}`);
                 }
            }}
            onQuickView={() => {}} // Пустая функция, т.к. не используется на этой странице
            onVirtualStage={() => {}} // Пустая функция
        />
      </main>
      <Footer />
      <CartSidebar onNavigate={(view) => {
          if (view.page === 'checkout') router.push('/checkout');
          if (view.page === 'catalog') router.push('/products');
      }} />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return { props: { allProducts: [] } };
  }
  try {
    const productsSnapshot = await adminDb.collection('products').get();
    const allProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
    
    return {
      props: { 
        allProducts: JSON.parse(JSON.stringify(allProducts)),
      },
      revalidate: 60, // Пересобирать страницу каждые 60 секунд
    };
  } catch (error) {
    console.error("Error fetching products for wishlist:", error);
    return { props: { allProducts: [] } };
  }
};
