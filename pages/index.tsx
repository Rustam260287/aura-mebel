
import React, { useEffect, useRef } from 'react';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { getAdminDb } from '../lib/firebaseAdmin';
import { COLLECTIONS } from '../lib/db/collections';
import type { ObjectPublic, View } from '../types';
import { Hero } from '../components/Hero';
import { Scenarios } from '../components/Scenarios';
import { Gallery } from '../components/Gallery';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { Meta } from '../components/Meta';
import { useExperience } from '../contexts/ExperienceContext';

interface HomePageProps {
  featuredObjects: ObjectPublic[];
  error?: string;
}

export default function HomePage({ featuredObjects, error }: HomePageProps) {
  const router = useRouter();
  const scenariosRef = useRef<HTMLDivElement>(null); 
  const { emitEvent } = useExperience();

  useEffect(() => {
    emitEvent({ type: 'ENTER_GALLERY' });
  }, [emitEvent]);

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
    if (view.page === 'objects') {
        router.push('/objects');
    } else if (view.page === 'about') {
        router.push('/about');
    }
  };

  return (
    <>
      <Meta title="Label — Мебель в вашем доме" description="Спокойное пространство выбора мебели без давления и маркетинга." />
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
            <h2 className="text-xl md:text-2xl font-medium text-soft-black mb-6 tracking-tight">Избранные модели</h2>
            <Gallery
                objects={featuredObjects}
                isLoading={router.isFallback}
                onObjectSelect={(id) => router.push(`/objects/${id}`)}
                onBrowseGallery={() => router.push('/objects')}
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
    if (!adminDb) return { props: { featuredObjects: [] } };

    const objectsSnapshot = await adminDb
      .collection(COLLECTIONS.objects)
      .limit(8)
      .select('name', 'imageUrls', 'objectType', 'category', 'modelGlbUrl', 'modelUsdzUrl')
      .get();
      
    const featuredObjects = objectsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name ?? '',
        imageUrls: data.imageUrls ?? [],
        objectType: data.objectType ?? data.category ?? '',
        modelGlbUrl: data.modelGlbUrl ?? '',
        modelUsdzUrl: data.modelUsdzUrl ?? '',
        description: '',
      };
    }) as ObjectPublic[];
    
    return {
      props: { 
        featuredObjects: JSON.parse(JSON.stringify(featuredObjects)) 
      },
      revalidate: 3600,
    };
  } catch (error) {
    return { props: { featuredObjects: [] } };
  }
};
