
import { GetServerSideProps } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { getAdminDb } from '../../lib/firebaseAdmin';
import { COLLECTIONS } from '../../lib/db/collections';
import type { ObjectPublic, ScenePresetPublic } from '../../types';
import { Catalog } from '../../components/Catalog';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons';
import { useObjectModals } from '../../hooks/useObjectModals';
import { SearchService } from '../../lib/services/search.service';
import { toPublicObject } from '../../lib/publicObject';
import { useExperience } from '../../contexts/ExperienceContext';
import { SceneCard } from '../../components/SceneCard';
import { toScenePresetPublic } from '../../lib/scenePreset';

const ImageZoomModal = dynamic(() => import('../../components/ImageZoomModal').then(mod => mod.ImageZoomModal), { ssr: false });

const ALL_CATEGORIES_FULL = ['Спальни', 'Кухни', 'Мягкая мебель', 'Гостиная'];
const ALL_CATEGORIES = process.env.NODE_ENV === 'development'
  ? ALL_CATEGORIES_FULL
  : ['Мягкая мебель'];
const ITEMS_PER_PAGE = 12;
const CATEGORY_IN_LIMIT = 10;

interface CatalogPageProps {
  objects: ObjectPublic[];
  scenes: ScenePresetPublic[];
  currentPage: number;
  totalPages: number;
  error?: string;
  searchQuery?: string;
}

export default function CatalogPage({ objects, scenes, currentPage, totalPages, error, searchQuery }: CatalogPageProps) {
  const router = useRouter();
  // Filter Sidebar удален для чистоты интерфейса
  const { emitEvent } = useExperience();

  useEffect(() => {
    emitEvent({ type: 'ENTER_GALLERY' });
  }, [emitEvent]);

  const {
    imageModalState,
    handleImageClick,
    closeImageModal,
  } = useObjectModals();

  // Filter State from URL
  const { category } = router.query;

  const selectedCategory = Array.isArray(category) ? category[0] : category;

  const handleCategoryChange = (newCategory: string) => {
    const query = { ...router.query };
    delete query.q;
    delete query.search;

    if (newCategory === selectedCategory) {
      delete query.category; // Toggle off
    } else {
      query.category = newCategory;
    }

    query.page = '1';
    router.push({ pathname: '/objects', query }, undefined, { scroll: true });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const query = { ...router.query, page: newPage.toString() };
      router.push({ pathname: '/objects', query }, undefined, { scroll: true });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-warm-white text-muted-gray">
        <p>Не удалось загрузить коллекцию. Попробуйте позже.</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-grow bg-transparent min-h-screen transition-colors duration-300">
        <div className="container mx-auto px-6 py-12">

          {/* Заголовок и поиск */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-medium text-soft-black dark:text-aura-dark-text-main mb-4 tracking-tight">
              {searchQuery ? `Поиск: "${searchQuery}"` : 'Коллекция для примерки'}
            </h1>
            {!searchQuery && (
              <p className="text-muted-gray dark:text-aura-dark-text-sec max-w-lg mx-auto leading-relaxed">
                Выберите объект, который хотите увидеть у себя дома.
              </p>
            )}
          </div>

          {/* Категории - как табы, чисто и просто */}
          {!searchQuery && (
            <div className="-mx-6 mb-16">
              <div className="relative">
                <div
                  className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    paddingLeft: 'calc(env(safe-area-inset-left) + 24px)',
                    paddingRight: 'calc(env(safe-area-inset-right) + 24px)',
                    scrollPaddingLeft: 'calc(env(safe-area-inset-left) + 24px)',
                    scrollPaddingRight: 'calc(env(safe-area-inset-right) + 24px)',
                  }}
                >
                  <div className="flex w-max gap-2 pb-4">
                    {ALL_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`
                                            snap-start shrink-0 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 border
                                            ${selectedCategory === cat
                            ? 'bg-soft-black text-white border-soft-black shadow-md dark:bg-stone-beige dark:text-aura-dark-base dark:border-stone-beige'
                            : 'bg-white text-muted-gray border-stone-beige/30 hover:border-soft-black hover:text-soft-black dark:bg-aura-dark-surface dark:text-aura-dark-text-sec dark:border-aura-dark-border dark:hover:text-aura-dark-text-main'}
                                        `}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtle edge fade to hint scrollability */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-warm-white to-transparent dark:from-aura-dark-base" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-warm-white to-transparent dark:from-aura-dark-base" />
              </div>
            </div>
          )}

          {/* Сетка объектов — Галерея */}
          {!searchQuery && scenes.length > 0 && (
            <section className="mb-20">
              <div className="flex items-end justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-medium text-soft-black dark:text-aura-dark-text-main tracking-tight">
                    Комплекты
                  </h2>
                  <p className="text-sm text-muted-gray dark:text-aura-dark-text-muted mt-2">
                    Набор отдельных предметов. В AR каждый можно двигать и масштабировать отдельно.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 md:gap-x-10 gap-y-14 md:gap-y-20">
                {scenes.map((scene, index) => (
                  <div
                    key={scene.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <SceneCard scene={scene} onSelect={(id) => router.push(`/scenes/${id}`)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <Catalog
            allObjects={objects}
            isLoading={false}
            onObjectSelect={(id) => router.push(`/objects/${id}`)}
            onImageClick={handleImageClick}
          />

          {/* Пагинация - минималистичная */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-20">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-3 rounded-full hover:bg-stone-beige/10 dark:hover:bg-aura-dark-surface disabled:opacity-30 transition-colors text-soft-black dark:text-aura-dark-text-main"
              >
                <ChevronLeftIcon className="w-6 h-6 stroke-1" />
              </button>
              <span className="text-sm font-medium text-muted-gray dark:text-aura-dark-text-muted tracking-widest">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-3 rounded-full hover:bg-stone-beige/10 dark:hover:bg-aura-dark-surface disabled:opacity-30 transition-colors text-soft-black dark:text-aura-dark-text-main"
              >
                <ChevronRightIcon className="w-6 h-6 stroke-1" />
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <ImageZoomModal
        key={`${imageModalState.objectName}-${imageModalState.initialIndex}-${imageModalState.isOpen ? 'open' : 'closed'}`}
        isOpen={imageModalState.isOpen}
        images={imageModalState.images}
        initialIndex={imageModalState.initialIndex}
        objectTitle={imageModalState.objectName}
        onClose={closeImageModal}
      />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) throw new Error("Firebase Admin SDK initialization failed.");

    const page = Number(context.query.page) || 1;
    const qParam = context.query.q || context.query.search;
    const queryParam = qParam ? String(qParam).trim() : '';
    const isDev = process.env.NODE_ENV === 'development';

    let objects: ObjectPublic[] = [];
    let scenes: ScenePresetPublic[] = [];
    let totalItems = 0;
    let totalPages = 1;

    // Поиск
    if (queryParam) {
      try {
        const found = await SearchService.search({ query: queryParam, limit: 30 });
        objects = found.map((p) => toPublicObject(p, p.id));
        if (!isDev) {
          objects = objects.filter(o => o.status !== 'draft' && o.status !== 'archived');
        }
        totalItems = objects.length;
        totalPages = 1;
      } catch (e) {
        console.error("Search failed:", e);
      }

      return {
        props: {
          objects: JSON.parse(JSON.stringify(objects)),
          scenes: [],
          currentPage: 1,
          totalPages: 1,
          searchQuery: queryParam
        }
      };
    }

    const categoryQuery = context.query.category;

    const selectedCategories = Array.isArray(categoryQuery) ? (categoryQuery as string[]) : categoryQuery ? [categoryQuery as string] : [];

    // Optimized "Fetch All & Filter In Memory" Strategy
    // Justification:
    // 1. Solving the "Eclipse not visible" bug requires checking both 'status' (new items) and 'category' (legacy items).
    // 2. Composite indexes for OR queries + Sorting are brittle or missing in production.
    // 3. Dataset is expected to be reasonable (< 2000 items). Fetching all metadata is safer and ensures consistent filtering.

    // 1. Fetch ALL objects (raw)
    const objectsCollection = adminDb.collection(COLLECTIONS.objects);
    const snapshot = await objectsCollection.get();

    // 2. Map and Filter in Memory
    let allPublicObjects = snapshot.docs
      .map(doc => toPublicObject(doc.data(), doc.id))
      .filter(o => {
        // Dev: Show everything
        if (isDev) return true;

        // Prod: Show only READY objects.
        const isVisible = o.status === 'ready';

        if (!isVisible) {
          // Log strictly hidden objects to help admin debug "Why is X missing?"
          // Use a safe check to avoid spamming logs for obvious drafts?
          // The user requested this specifically.
          console.warn(`[Catalog Filter] Hiding object: ${o.id} (${o.name}) | Status: ${o.status || 'undefined'} | Cat: ${o.category}`);
        }

        return isVisible;
      });

    // 3. Apply Category Filter (if selected)
    if (!isDev && selectedCategories.length > 0) {
      allPublicObjects = allPublicObjects.filter(o => {
        const cat = (o.category || '').toLowerCase();
        const type = (o.objectType || '').toLowerCase();
        return selectedCategories.some(sc => {
          const scLower = sc.toLowerCase();
          return cat === scLower || type === scLower; // Exact match or strict enough?
          // Use includes if we want loose matching like earlier logic:
          // return cat.includes(scLower) || type.includes(scLower);
          // Let's stick to the previous strict-ish logic but on the mapped object.
          // Previous DB logic was EXACT match on 'category'.
          // But we want to allow "Sofa" to match "Мягкая мебель"? No, sidebar has specific buttons.
          return cat === scLower;
        });
      });
    }

    // 4. Search (if local search needed, but we handled search above via SearchService?)
    // The code above handles ?q separately. 

    // 5. Calculate Pagination Stats
    totalItems = allPublicObjects.length;
    totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const safePage = Math.max(1, Math.min(page, totalPages));
    const offset = (safePage - 1) * ITEMS_PER_PAGE;

    // 6. Sort (Alphabetical)
    allPublicObjects.sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }));

    // 7. Slice Page
    objects = allPublicObjects.slice(offset, offset + ITEMS_PER_PAGE);

    // Scenes / presets (not paginated)
    try {
      const scenesSnap = await adminDb
        .collection(COLLECTIONS.scenePresets)
        .where('status', '==', 'ready')
        .get();

      const rawScenes = scenesSnap.docs.map((doc) => toScenePresetPublic(doc.data(), doc.id));
      const neededCoverObjectIds = new Set<string>();
      for (const s of rawScenes) {
        if (s.coverImageUrl) continue;
        const first = s.objects?.[0]?.objectId;
        if (first) neededCoverObjectIds.add(first);
      }

      // Optimization: We already have all objects in 'snapshot'!
      // No need to fetch again.
      const coverByObjectId = new Map<string, string>();
      // Create a map from the FULL snapshot (including drafts/archived, as they might be covers?)
      // Actually, snapshot has everything.
      snapshot.docs.forEach(doc => {
        if (neededCoverObjectIds.has(doc.id)) {
          const d = doc.data();
          const imageUrls = Array.isArray(d?.imageUrls) ? d?.imageUrls : [];
          const firstUrl = typeof imageUrls?.[0] === 'string' ? (imageUrls[0] as string) : '';
          if (firstUrl) coverByObjectId.set(doc.id, firstUrl);
        }
      });

      scenes = rawScenes.map((s) => {
        if (s.coverImageUrl) return s;
        const first = s.objects?.[0]?.objectId;
        const derived = first ? coverByObjectId.get(first) : undefined;
        return { ...s, ...(derived ? { coverImageUrl: derived } : {}) };
      });

    } catch (e) {
      console.error('Scenes fetch failed:', e);
      scenes = [];
    }

    return {
      props: {
        objects: JSON.parse(JSON.stringify(objects)),
        scenes: JSON.parse(JSON.stringify(scenes)),
        currentPage: safePage,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Objects Error:", error);
    return { props: { objects: [], scenes: [], currentPage: 1, totalPages: 1, error: "Сервис временно недоступен" } };
  }
};
