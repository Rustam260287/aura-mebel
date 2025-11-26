
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
import { Header } from '../components/Header';
import { SEO } from '../components/SEO';

const CartSidebar = dynamic(() => import('../components/CartSidebar').then(mod => mod.CartSidebar), { ssr: false });
const QuickViewModal = dynamic(() => import('../components/QuickViewModal').then(mod => mod.QuickViewModal), { ssr: false });

interface HomePageProps {
  popularProducts: Product[];
  error?: string;
}

export default function HomePage({ popularProducts, error }: HomePageProps) {
  const router = useRouter();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

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
  
  return (
    <>
      <SEO title="Главная" description="Откройте для себя мир премиальной мебели Aura. Идеальное сочетание стиля, комфорта и качества для вашего дома." />
      <Header />
      <main className="flex-grow">
        <Hero onNavigate={handleNavigate} />
        <CategoryShowcase onNavigate={handleNavigate} />
        <Catalog
          allProducts={popularProducts}
          isLoading={router.isFallback}
          onProductSelect={(id) => router.push(`/products/${id}`)}
          onQuickView={setQuickViewProduct}
          onVirtualStage={() => {}}
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
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Firebase Admin SDK initialization failed.");
    }

    // **ОПТИМИЗАЦИЯ:** Запрашиваем только 4 товара с самым высоким рейтингом
    const productsSnapshot = await adminDb.collection('products')
      .orderBy('rating', 'desc')
      .limit(4)
      .get();
      
    const popularProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];

    // Обработка URL картинок (если нужно) остается, но теперь только для 4 товаров
    // (В нашем случае URL уже публичные, поэтому этот шаг можно пропустить или упростить)
    
    return {
      props: { 
        popularProducts: JSON.parse(JSON.stringify(popularProducts)) 
      },
      revalidate: 3600, // Пересобираем страницу раз в час
    };
  } catch (error) {
    console.error("Error fetching popular products:", error);
    // Если Firestore требует индекс, ошибка будет содержать ссылку для его создания
    if (error.message.includes('requires an index')) {
         return { props: { popularProducts: [], error: `Firestore требует индекс. Пожалуйста, создайте его по ссылке из лога ошибки в терминале.` } };
    }
    return { props: { popularProducts: [], error: error.message } };
  }
};
