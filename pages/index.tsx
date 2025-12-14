
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
      <div className="flex flex-col items-center justify-center min-h-screen text-brand-terracotta">
        <h1 className="text-2xl font-bold mb-4">Ошибка загрузки данных</h1>
        <p>{error}</p>
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
    }
  };

  const handleVirtualStage = (product: Product) => {
    addToast(`Примерка AR для "${product.name}" скоро появится!`, 'info');
  };

  return (
    <>
      <SEO title="Главная" description="Откройте для себя мир премиальной мебели Labelcom. Идеальное сочетание стиля, комфорта и качества для вашего дома." />
      <Header />
      <main className="flex-grow">
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
      .limit(4)
      .select('name', 'price', 'rating', 'imageUrls', 'category', 'description', 'seoDescription', 'model3dUrl')
      .get();
      
    const popularProducts = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.get('name') ?? '',
      price: doc.get('price') ?? 0,
      rating: doc.get('rating') ?? 0,
      imageUrls: doc.get('imageUrls') ?? [],
      category: doc.get('category') ?? '',
      description: doc.get('description') ?? '',
      seoDescription: doc.get('seoDescription') ?? '',
      model3dUrl: doc.get('model3dUrl') ?? '',
    })) as Product[];
    
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
      return { props: { popularProducts: [], error: error.message } };
    }
    return { props: { popularProducts: [], error: 'Произошла неизвестная ошибка.' } };
  }
};
