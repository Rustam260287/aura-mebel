
import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { WishlistPage as WishlistPageComponent } from '../components/WishlistPage';
import { useRouter } from 'next/router';
import type { Product, View } from '../types';
import { useWishlist } from '../contexts/WishlistContext';
import { Spinner } from '../components/Spinner';

export default function Wishlist() {
  const router = useRouter();
  const { wishlistItems } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isActive = true;
    const fetchProducts = async () => {
      if (wishlistItems.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const idsParam = encodeURIComponent(wishlistItems.join(','));
        const res = await fetch(`/api/products/wishlist?ids=${idsParam}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isActive) setProducts(data.products || []);
      } catch (e) {
        console.error('Failed to load wishlist products', e);
        if (isActive) setProducts([]);
      } finally {
        if (isActive) setLoading(false);
      }
    };
    fetchProducts();
    return () => { isActive = false; };
  }, [wishlistItems]);

  return (
    <>
      <Header />
      <main className="flex-grow">
        <WishlistPageComponent 
            products={products}
            isLoading={loading}
            onNavigate={(view: View) => {
                 if (view.page === 'product' && 'productId' in view) {
                     router.push(`/products/${view.productId}`);
                 }
                 if (view.page === 'catalog') {
                     router.push('/products');
                 }
            }}
            onQuickView={() => {}} // Пустая функция, т.к. не используется на этой странице
            onVirtualStage={() => {}} // Пустая функция
        />
      </main>
      <Footer />
    </>
  );
}
