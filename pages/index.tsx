
import React, { useRef } from 'react';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { getAdminDb } from '../lib/firebaseAdmin';
import type { Product, View } from '../types';
import { Hero } from '../components/Hero';
import { Scenarios } from '../components/Scenarios';
import { Gallery } from '../components/Gallery';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { SEO } from '../components/SEO';

interface HomePageProps {
  popularProducts: Product[];
  error?: string;
}

export default function HomePage({ popularProducts, error }: HomePageProps) {
  const router = useRouter();
  const scenariosRef = useRef<HTMLDivElement>(null); 

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-warm-white text-muted-gray">
        <p>{error}</p>
      </div>
    );
  }

  const handleNavigate = (view: View) => {
    // 1. Скролл к сценариям (вызывается из Hero)
    if (view.page === 'scenarios') {
        if (scenariosRef.current) {
            scenariosRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        return;
    }
    
    // 2. Обычная навигация (вызывается из Scenarios)
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
      <SEO title="Label — Мебель в вашем доме" description="Спокойное пространство выбора мебели без давления и маркетинга." />
      <Header />
      <main className="flex-grow bg-warm-white">
        
        {/* 1. Hero Block */}
        <Hero onNavigate={handleNavigate} />
        
        {/* 2. Scenarios */}
        <div ref={scenariosRef} className="scroll-mt-24">
             <Scenarios onNavigate={handleNavigate} />
        </div>

        {/* 3. Gallery */}
        <div className="container mx-auto px-6 pb-24">
            <h2 className="text-2xl font-medium text-soft-black mb-8 pl-1">Избранные модели</h2>
            <Gallery
                products={popularProducts}
                isLoading={router.isFallback}
                onProductSelect={(id) => router.push(`/products/${id}`)}
            />
        </div>

        {/* 4. How it works */}
        <div className="container mx-auto px-6 pb-24 text-center">
            <div className="max-w-md mx-auto space-y-3 text-muted-gray text-sm font-normal">
                <p>Выберите объект</p>
                <p>Посмотрите в комнате</p>
                <p>Обсудите с менеджером, если захотите</p>
            </div>
        </div>

      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) return { props: { popularProducts: [] } };

    const productsSnapshot = await adminDb
      .collection('products')
      .limit(8)
      .select('name', 'imageUrls', 'category', 'model3dUrl')
      .get();
      
    const popularProducts = productsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name ?? '',
        imageUrls: data.imageUrls ?? [],
        category: data.category ?? '',
        model3dUrl: data.model3dUrl ?? '',
        description: '',
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
