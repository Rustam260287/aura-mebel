
// pages/index.tsx
import React, { useMemo, useState } from 'react';
import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { getAdminDb, getAdminStorage } from '../lib/firebaseAdmin'; // Обновленный импорт
import type { Product, View } from '../types';

import { Hero } from '../components/Hero';
import { CategoryShowcase } from '../components/CategoryShowcase';
import { Catalog } from '../components/Catalog';
import { Footer } from '../components/Footer';

const Header = dynamic(() => import('../components/Header').then(mod => mod.Header), { ssr: false });
const CartSidebar = dynamic(() => import('../components/CartSidebar').then(mod => mod.CartSidebar), { ssr: false });
const AiChatbot = dynamic(() => import('../components/AiChatbot').then(mod => mod.AiChatbot), { ssr: false });
const FloatingChatButton = dynamic(() => import('../components/FloatingChatButton').then(mod => mod.FloatingChatButton), { ssr: false });
const QuickViewModal = dynamic(() => import('../components/QuickViewModal'), { ssr: false });
const VirtualStagingModal = dynamic(() => import('../components/VirtualStagingModal'), { ssr: false });

interface HomePageProps {
  allProducts: Product[];
  error?: string;
}

export default function HomePage({ allProducts, error }: HomePageProps) {
  const router = useRouter();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [virtualStageProduct, setVirtualStageProduct] = useState<Product | null>(null);

  if (error) {
    return <div style={{ color: 'red', padding: '2rem' }}>Error loading data: {error}</div>;
  }

  const handleNavigate = (view: View) => {
    // ...
  };
  
  const popularProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    return [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
  }, [allProducts]);

  return (
    <>
      <Header onStyleFinderClick={() => {}} />
      <main className="flex-grow">
        <Hero onNavigate={handleNavigate} />
        <CategoryShowcase onNavigate={handleNavigate} />
        <Catalog
          allProducts={popularProducts}
          onProductSelect={(id) => router.push(`/products/${id}`)}
          onQuickView={setQuickViewProduct}
          onVirtualStage={setVirtualStageProduct}
          isHomePage
        />
      </main>
      <Footer />
      <CartSidebar onNavigate={(view) => router.push(`/${view.page}`)} />
      <AiChatbot />
      <FloatingChatButton />
      {quickViewProduct && <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onViewDetails={(id) => router.push(`/products/${id}`)} />}
      {virtualStageProduct && <VirtualStagingModal product={virtualStageProduct} onClose={() => setVirtualStageProduct(null)} />}
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const adminDb = getAdminDb(); // Вызываем функцию
  const adminStorage = getAdminStorage(); // Вызываем функцию

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
            if (url && url.startsWith('gs://')) { // Добавлена проверка на существование url
                const path = url.substring(url.indexOf('/', 5) + 1);
                try {
                    const [signedUrl] = await bucket.file(path).getSignedUrl({
                        action: 'read',
                        expires: '03-09-2491'
                    });
                    return signedUrl;
                } catch (e) {
                    console.error(`Error getting signed URL for ${path}:`, e.message);
                    return '/placeholder.svg';
                }
            }
            return url || '/placeholder.svg'; // Возвращаем плейсхолдер, если url пустой
        }));
        
        const { imageUrl, ...rest } = product;
        return { ...rest, imageUrls };
    }));
    
    return {
      props: { allProducts: JSON.parse(JSON.stringify(allProducts)) },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { props: { allProducts: [], error: errorMessage } };
  }
};
