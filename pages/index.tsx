// pages/index.tsx
import React, { useMemo, useState } from 'react';
import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { getAdminDb } from '../lib/firebaseAdmin';
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
}

export default function HomePage({ allProducts }: HomePageProps) {
  const router = useRouter();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [virtualStageProduct, setVirtualStageProduct] = useState<Product | null>(null);

  const handleNavigate = (view: View) => {
    switch (view.page) {
      case 'product':
        router.push(`/products/${view.productId}`);
        break;
      case 'blog-list':
        router.push('/blog');
        break;
      case 'visual-search':
        router.push('/visual-search');
        break;
      case 'ai-room-makeover':
        router.push('/ai-room-makeover');
        break;
      default:
        console.log('Navigating to:', view);
    }
  };

  const popularProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    return [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
  }, [allProducts]);

  return (
    <>
      <Header onNavigate={handleNavigate} onStyleFinderClick={() => {}} />
      <main className="flex-grow">
        <Hero onNavigate={handleNavigate} />
        <CategoryShowcase onNavigate={handleNavigate} />
        <Catalog
          allProducts={popularProducts}
          onProductSelect={(id) => handleNavigate({ page: 'product', productId: id })}
          onQuickView={setQuickViewProduct}
          onVirtualStage={setVirtualStageProduct}
          isHomePage
        />
      </main>
      <Footer onNavigate={handleNavigate} />
      
      <CartSidebar onNavigate={handleNavigate} />
      <AiChatbot />
      <FloatingChatButton />

      {quickViewProduct && <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onViewDetails={(id) => router.push(`/products/${id}`)} />}
      {virtualStageProduct && <VirtualStagingModal product={virtualStageProduct} onClose={() => setVirtualStageProduct(null)} />}
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const dbAdmin = getAdminDb();
  if (!dbAdmin) { return { props: { allProducts: [] } }; }

  try {
    const productsSnapshot = await dbAdmin.collection('products').get();
    const allProducts = productsSnapshot.docs.map(doc => doc.data());
    return {
      props: {
        allProducts: JSON.parse(JSON.stringify(allProducts)),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { props: { allProducts: [] } };
  }
};
