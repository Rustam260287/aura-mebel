
import React, { useEffect, useRef } from 'react';
import type { GetServerSideProps } from 'next';
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-warm-white dark:bg-aura-dark-base text-muted-gray dark:text-aura-dark-text-muted">
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
    } else if (view.page === 'wizard') {
      router.push('/wizard');
    } else if (view.page === 'redesign') {
      router.push('/redesign');
    } else if (view.page === 'about') {
      router.push('/about');
    }
  };

  return (
    <>
      <Meta title="AURA" description="Спокойное пространство выбора мебели без давления." />
      <Header />
      <main className="flex-grow bg-transparent transition-colors duration-300">

        {/* 1. Hero Block */}
        <Hero
          onNavigate={handleNavigate}
          heroImageUrl={featuredObjects?.[0]?.imageUrls?.[0]}
        />

        {/* 2. Scenarios */}
        <div ref={scenariosRef} className="scroll-mt-24 pt-12 md:pt-24">
          <Scenarios onNavigate={handleNavigate} />
        </div>

        {/* 3. Gallery */}
        <div className="container mx-auto px-6 py-24 md:py-32">
          <h2 className="text-3xl md:text-4xl font-serif italic text-soft-black dark:text-aura-dark-text-main mb-12 tracking-tight">Избранные объекты</h2>
          <Gallery
            objects={featuredObjects}
            isLoading={false}
            onObjectSelect={(id) => router.push(`/objects/${id}`)}
            onBrowseGallery={() => router.push('/objects')}
          />
        </div>

        {/* 4. How it works */}
        <div className="container mx-auto px-6 pb-32 text-center">
          <div className="max-w-md mx-auto space-y-3 text-muted-gray dark:text-aura-dark-text-muted text-sm font-normal">
            <p>Посмотрите</p>
            <p>Примерьте</p>
            <p>Сохраните</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error("Admin DB not initialized");
      return { props: { featuredObjects: [] } };
    }

    console.log(`[Home] Fetching from collection: ${COLLECTIONS.objects}`);

    const objectsSnapshot = await adminDb
      .collection(COLLECTIONS.objects)
      .limit(8)
      // .select(...) removed for debugging
      .get();

    if (objectsSnapshot.empty) {
      console.warn("[Home] Collection is empty. Check collection name and permissions.");
    } else {
      console.log(`[Home] Found ${objectsSnapshot.size} objects.`);
    }

    const isDev = process.env.NODE_ENV === 'development';

    const featuredObjects = objectsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name ?? 'Без названия',
        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
        objectType: data.objectType ?? data.category ?? 'Мебель',
        modelGlbUrl: data.modelGlbUrl ?? '',
        modelUsdzUrl: data.modelUsdzUrl ?? '',
        description: data.description ?? '',
        status: data.status, // Pass status for filtering if done later, but better here
      };
    })
      .filter((obj: any) => {
        if (isDev) return true;
        // Production: Hide explicit draft/archived
        return obj.status !== 'draft' && obj.status !== 'archived';
      }) as ObjectPublic[];

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    return {
      props: {
        featuredObjects: JSON.parse(JSON.stringify(featuredObjects))
      },
    };
  } catch (error) {
    console.error("[Home] Error in getServerSideProps:", error);
    return { props: { featuredObjects: [] } };
  }
};
