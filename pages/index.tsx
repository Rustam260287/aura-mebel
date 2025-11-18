
// pages/index.tsx
import React, { useMemo, useState } from 'react';
import { GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { getAdminDb, getAdminStorage } from '../lib/firebaseAdmin';
import type { Product, View } from '../types';

import { Hero } from '../components/Hero';
import { CategoryShowcase } from '../components/CategoryShowcase';
import { Catalog } from '../components/Catalog';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header'; // Импортируем статически

const CartSidebar = dynamic(() => import('../components/CartSidebar').then(mod => mod.CartSidebar), { ssr: false });
const QuickViewModal = dynamic(() => import('../components/QuickViewModal').then(mod => mod.QuickViewModal), { ssr: false });

interface HomePageProps {
  allProducts: Product[];
  error?: string;
}

export default function HomePage({ allProducts, error }: HomePageProps) {
  const router = useRouter();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const popularProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    return [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
  }, [allProducts]);

  if (error) {
    return <div style={{ color: 'red', padding: '2rem' }}>Error loading data: {error}</div>;
  }

  const handleNavigate = (view: View) => {
    if (view.page === 'catalog') {
      if (view.category) {
        router.push(`/products?category=${encodeURIComponent(view.category)}`);
      } else {
        router.push('/products');
      }
    }
  };
  
  return (
    <>
      <Header />
      <main className="flex-grow">
        <Hero onNavigate={handleNavigate} />
        <CategoryShowcase onNavigate={handleNavigate} />
        <Catalog
          allProducts={popularProducts}
          isLoading={router.isFallback}
          onProductSelect={(id) => router.push(`/products/${id}`)}
          onQuickView={setQuickViewProduct}
          onVirtualStage={() => {}} // Пустая функция, так как VirtualStaging удален
          isHomePage
        />
      </main>
      <Footer />
      <CartSidebar onNavigate={(view) => router.push(`/${view.page}`)} />
      {quickViewProduct && <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onViewDetails={(id) => router.push(`/products/${id}`)} />}
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const adminDb = getAdminDb();
  const adminStorage = getAdminStorage();

  if (!adminDb || !adminStorage) {
    return { props: { allProducts: [], error: "Firebase Admin SDK initialization failed." } };
  }
  try {
    const productsSnapshot = await adminDb.collection('products').get();
    const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];

    const bucket = adminStorage.bucket();
    
    const allProducts = await Promise.all(productsData.map(async (product) => {
        if (!Array.isArray(product.imageUrls)) {
            console.warn(`Product with id ${product.id} has invalid imageUrls`);
            return { ...product, imageUrls: ['/placeholder.svg'] };
        }

        const imageUrls = await Promise.all(product.imageUrls.map(async (url) => {
            if (url && url.startsWith('gs://')) {
                const path = url.substring(url.indexOf('/', 5) + 1);
                try {
                    const [signedUrl] = await bucket.file(path).getSignedUrl({
                        action: 'read',
                        expires: '03-09-2491'
                    });
                    return signedUrl;
                } catch (e) {
                    if (e instanceof Error) {
                        console.error(`Error getting signed URL for ${path}:`, e.message);
                    } else {
                        console.error(`An unknown error occurred while getting signed URL for ${path}`);
                    }
                    return '/placeholder.svg';
                }
            }
            return url || '/placeholder.svg';
        }));
        
        return { ...product, imageUrls };
    }));
    
    return {
      props: { allProducts: JSON.parse(JSON.stringify(allProducts)) },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { props: { allProducts: [], error: errorMessage } };
  }
};
