
import { GetServerSideProps } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { getAdminDb } from '../../lib/firebaseAdmin';
import { COLLECTIONS } from '../../lib/db/collections';
import type { ObjectPublic } from '../../types';
import { Catalog } from '../../components/Catalog';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons';
import { useObjectModals } from '../../hooks/useObjectModals';
import { SearchService } from '../../lib/services/search.service';
import { toPublicObject } from '../../lib/publicObject';
import { useExperience } from '../../contexts/ExperienceContext';

const ImageZoomModal = dynamic(() => import('../../components/ImageZoomModal').then(mod => mod.ImageZoomModal), { ssr: false });

const ITEMS_PER_PAGE = 12;
const ALL_CATEGORIES = ['Спальни', 'Кухни', 'Мягкая мебель', 'Гостиная'];
const CATEGORY_IN_LIMIT = 10;

interface CatalogPageProps {
  objects: ObjectPublic[];
  currentPage: number;
  totalPages: number;
  error?: string;
  searchQuery?: string;
}

export default function CatalogPage({ objects, currentPage, totalPages, error, searchQuery }: CatalogPageProps) {
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
      <main className="flex-grow bg-warm-white min-h-screen">
        <div className="container mx-auto px-6 py-12">
            
            {/* Заголовок и поиск */}
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-medium text-soft-black mb-4 tracking-tight">
                    {searchQuery ? `Поиск: "${searchQuery}"` : 'Коллекция для примерки'}
                </h1>
                {!searchQuery && (
                    <p className="text-muted-gray max-w-lg mx-auto leading-relaxed">
                        Выберите объект, который хотите увидеть у себя дома.
                    </p>
                )}
            </div>

            {/* Категории - как табы, чисто и просто */}
            {!searchQuery && (
                <div className="flex justify-center mb-16 overflow-x-auto pb-4 scrollbar-hide">
                    <div className="flex gap-2">
                        {ALL_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`
                                    px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 border
                                    ${selectedCategory === cat 
                                        ? 'bg-soft-black text-white border-soft-black shadow-md' 
                                        : 'bg-white text-muted-gray border-stone-beige/30 hover:border-soft-black hover:text-soft-black'}
                                `}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
	            {/* Сетка объектов — Галерея */}
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
                        className="p-3 rounded-full hover:bg-stone-beige/10 disabled:opacity-30 transition-colors text-soft-black"
                    >
                        <ChevronLeftIcon className="w-6 h-6 stroke-1" />
                    </button>
                    <span className="text-sm font-medium text-muted-gray tracking-widest">
                        {currentPage} / {totalPages}
                    </span>
                    <button 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={currentPage >= totalPages}
                        className="p-3 rounded-full hover:bg-stone-beige/10 disabled:opacity-30 transition-colors text-soft-black"
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
    
    let objects: ObjectPublic[] = [];
    let totalItems = 0;
    let totalPages = 1;

    // Поиск
    if (queryParam) {
        try {
            const found = await SearchService.search({ query: queryParam, limit: 30 });
            objects = found.map((p) => toPublicObject(p, p.id));
            totalItems = objects.length;
            totalPages = 1; 
        } catch (e) {
            console.error("Search failed:", e);
        }
        
        return {
            props: {
                objects: JSON.parse(JSON.stringify(objects)),
                currentPage: 1,
                totalPages: 1,
                searchQuery: queryParam
            }
        };
    }

    const categoryQuery = context.query.category;

    const selectedCategories = Array.isArray(categoryQuery) ? (categoryQuery as string[]) : categoryQuery ? [categoryQuery as string] : [];

    let baseQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb.collection(COLLECTIONS.objects);
    
    // Фильтрация по категории
    if (selectedCategories.length > 0) {
      if (selectedCategories.length === 1) {
        baseQuery = baseQuery.where('category', '==', selectedCategories[0]);
      } else {
        baseQuery = baseQuery.where('category', 'in', selectedCategories.slice(0, CATEGORY_IN_LIMIT));
      }
    }

    // Получаем общее количество для пагинации
    const totalItemsSnapshot = await baseQuery.count().get();
    totalItems = totalItemsSnapshot.data().count ?? 0;
    totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const safePage = Math.max(1, Math.min(page, totalPages));
    const offset = (safePage - 1) * ITEMS_PER_PAGE;

    // Запрос с пагинацией
    const sortedQuery = baseQuery.orderBy('name', 'asc');
    const pageSnapshot = await sortedQuery.offset(offset).limit(ITEMS_PER_PAGE).get();
    
    objects = pageSnapshot.docs.map(doc => {
      const data = doc.data();
      const imageUrls = (data.imageUrls || []).map((url: string) => url || '/placeholder.svg');
      return { 
          id: doc.id,
          name: data.name ?? '',
          imageUrls,
          objectType: data.objectType ?? data.category ?? '',
          description: data.description ?? '',
          modelGlbUrl: data.modelGlbUrl ?? '',
          modelUsdzUrl: data.modelUsdzUrl ?? '',
          // Другие поля по необходимости
      };
    }) as ObjectPublic[];

    return {
      props: {
        objects: JSON.parse(JSON.stringify(objects)),
        currentPage: safePage,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Objects Error:", error);
    return { props: { objects: [], currentPage: 1, totalPages: 1, error: "Сервис временно недоступен" } };
  }
};
