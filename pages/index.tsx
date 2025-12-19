
import React from 'react';
import { GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { getAdminDb } from '../lib/firebaseAdmin';
import type { Product, View } from '../types';
import { Hero } from '../components/Hero';
import { Scenarios } from '../components/Scenarios'; // Новый компонент
import { Catalog } from '../components/Catalog';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { SEO } from '../components/SEO';
import { useToast } from '../contexts/ToastContext';
import { useProductModals } from '../hooks/useProductModals';

const QuickViewModal = dynamic(() => import('../components/QuickViewModal').then(mod => mod.QuickViewModal), { ssr: false });
const ImageZoomModal = dynamic(() => import('../components/ImageZoomModal').then(mod => mod.ImageZoomModal), { ssr: false });

interface HomePageProps {
  popularProducts: Product[];
  error?: string;
}

export default function HomePage({ popularProducts, error }: HomePageProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const {
    quickViewProduct,
    openQuickView,
    closeQuickView,
    imageModalState,
    handleImageClick,
    closeImageModal,
  } = useProductModals();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-warm-white text-muted-gray">
        <p>{error}</p>
      </div>
    );
  }

  const handleNavigate = (view: View) => {
    if (view.page === 'catalog') {
        router.push('/products');
    } else if (view.page === 'ai-room-makeover') {
        router.push('/ai-room-makeover');
    } else if (view.page === 'furniture-from-photo') {
        router.push('/furniture-from-photo');
    } else if (view.page === 'about') {
        router.push('/about');
    }
  };

  return (
    <>
      <SEO title="Labelcom — Мебель дома" description="Спокойное пространство выбора мебели." />
      <Header />
      <main className="flex-grow bg-warm-white">
        
        {/* 1. Hero */}
        <Hero onNavigate={handleNavigate} />
        
        {/* 2. Scenarios */}
        <Scenarios onNavigate={handleNavigate} />

        {/* 3. Gallery (Selected Models) */}
        <div className="container mx-auto px-6 pb-24">
            <h2 className="text-2xl font-medium text-soft-black mb-8 pl-1">Избранные модели</h2>
            <Catalog
                allProducts={popularProducts} // Limit to 4-8 on server side
                isLoading={router.isFallback}
                onProductSelect={(id) => router.push(`/products/${id}`)}
                onQuickView={openQuickView}
                onVirtualStage={() => {}}
                onImageClick={handleImageClick}
                isHomePage // This triggers specialized "Gallery" mode in Catalog
            />
        </div>

        {/* 4. How it works (Quiet text) */}
        <div className="container mx-auto px-6 pb-24 text-center">
            <div className="max-w-md mx-auto space-y-2 text-muted-gray text-sm">
                <p>Выберите мебель</p>
                <p>Посмотрите в комнате</p>
                <p>Узнайте стоимость, если захотите</p>
            </div>
        </div>

      </main>
      <Footer />
      
      {/* Modals */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={closeQuickView}
          onViewDetails={(id) => router.push(`/products/${id}`)}
        />
      )}
      <ImageZoomModal
        key={`${imageModalState.productName}-${imageModalState.initialIndex}`}
        isOpen={imageModalState.isOpen}
        images={imageModalState.images}
        initialIndex={imageModalState.initialIndex}
        productName={imageModalState.productName}
        onClose={closeImageModal}
      />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) return { props: { popularProducts: [] } };

    const productsSnapshot = await adminDb.collection('products')
      .orderBy('rating', 'desc')
      .limit(8)
      .select('name', 'imageUrls', 'category', 'model3dUrl') // Fetch ONLY needed fields for gallery
      .get();
      
    const popularProducts = productsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name ?? '',
        imageUrls: data.imageUrls ?? [],
        category: data.category ?? '',
        model3dUrl: data.model3dUrl ?? '',
        price: 0, // Price hidden in gallery
      };
    }) as Product[];
    
    return {
      props: { 
        popularProducts: JSON.parse(JSON.stringify(popularProducts)) 
      },
      revalidate: 3600,
    };
  } catch (error) {
    return { props: { popularProducts: [] } };
  }
};
