
import React from 'react';
import { GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { getAdminDb } from '../lib/firebaseAdmin';
import type { Product, View } from '../types';
import { Hero } from '../components/Hero';
import { CategoryShowcase } from '../components/CategoryShowcase';
import { Catalog } from '../components/Catalog';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { SEO } from '../components/SEO';
import { useToast } from '../contexts/ToastContext';
import { useProductModals } from '../hooks/useProductModals';
import { Lookbook } from '../components/Lookbook';

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
      <div className="flex flex-col items-center justify-center min-h-screen text-brand-terracotta bg-brand-cream">
        <h1 className="text-2xl font-bold mb-4 font-serif">Внимание</h1>
        <p className="text-brand-charcoal">{error}</p>
      </div>
    );
  }

  const handleNavigate = (view: View) => {
    if (view.page === 'catalog') {
      if (view.category) {
        router.push(`/products?category=${encodeURIComponent(view.category)}`);
      } else {
        router.push('/products');
      }
    } else if (view.page === 'blog') {
        router.push('/blog');
    } else if (view.page === 'about') {
        router.push('/about');
    }
  };

  const handleVirtualStage = (product: Product) => {
    addToast(`Примерка AR для "${product.name}" скоро появится!`, 'info');
  };

  return (
    <>
      <SEO title="Главная" description="Откройте для себя мир премиальной мебели Labelcom. Идеальное сочетание стиля, комфорта и качества для вашего дома." />
      <Header />
      <main className="flex-grow bg-white">
        <Hero onNavigate={handleNavigate} />
        <CategoryShowcase onNavigate={handleNavigate} />
        <Catalog
          allProducts={popularProducts}
          isLoading={router.isFallback}
          onProductSelect={(id) => router.push(`/products/${id}`)}
          onQuickView={openQuickView}
          onVirtualStage={handleVirtualStage}
          onImageClick={handleImageClick}
          isHomePage
        />
        <Lookbook onNavigate={handleNavigate} />
      </main>
      <Footer />
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={closeQuickView}
          onViewDetails={(id) => router.push(`/products/${id}`)}
        />
      )}
      <ImageZoomModal
        key={`${imageModalState.productName}-${imageModalState.initialIndex}-${imageModalState.isOpen ? 'open' : 'closed'}`}
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
    if (!adminDb) {
      throw new Error("Firebase Admin SDK initialization failed.");
    }

    const productsSnapshot = await adminDb.collection('products')
      .orderBy('rating', 'desc')
      .limit(8)
      .select('name', 'price', 'rating', 'imageUrls', 'category', 'description', 'seoDescription', 'model3dUrl', 'originalPrice', 'specs')
      .get();
      
    const popularProducts = productsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name ?? '',
        price: data.price ?? 0,
        rating: data.rating ?? 0,
        imageUrls: data.imageUrls ?? [],
        category: data.category ?? '',
        description: data.description ?? '',
        seoDescription: data.seoDescription ?? '',
        model3dUrl: data.model3dUrl ?? '',
        originalPrice: data.originalPrice ?? null,
        specs: data.specs ?? {},
      };
    }) as Product[];
    
    return {
      props: { 
        popularProducts: JSON.parse(JSON.stringify(popularProducts)) 
      },
      revalidate: 3600,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('requires an index')) {
        return { props: { popularProducts: [], error: `Firestore требует индекс. Пожалуйста, создайте его по ссылке из лога ошибки в терминале.` } };
      }
      console.error("Error fetching popular products:", error);
      return { props: { popularProducts: [], error: error.message } };
    }
    return { props: { popularProducts: [], error: 'Произошла неизвестная ошибка.' } };
  }
};
