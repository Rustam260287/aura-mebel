
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { getAdminDb } from '../../lib/firebaseAdmin';
import type { Product } from '../../types';
import { Catalog } from '../../components/Catalog';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/Button';
import { ChevronLeftIcon, ChevronRightIcon, SlidersHorizontalIcon } from '../../components/Icons';
import { FilterSidebar } from '../../components/FilterSidebar';
import { useToast } from '../../contexts/ToastContext'; // Import Toast
import { useProductModals } from '../../hooks/useProductModals';

const QuickViewModal = dynamic(() => import('../../components/QuickViewModal').then(mod => mod.QuickViewModal), { ssr: false });
const ImageZoomModal = dynamic(() => import('../../components/ImageZoomModal').then(mod => mod.ImageZoomModal), { ssr: false });


const ITEMS_PER_PAGE = 12;
const ALL_CATEGORIES = ['Спальни', 'Кухни', 'Мягкая мебель', 'Гостиная'];
const DEFAULT_MAX_PRICE = 1_000_000;
const CATEGORY_IN_LIMIT = 10;

const SORT_CONFIGS: Record<string, { field: string; direction: FirebaseFirestore.OrderByDirection }> = {
  rating_desc: { field: 'rating', direction: 'desc' },
  price_asc: { field: 'price', direction: 'asc' },
  price_desc: { field: 'price', direction: 'desc' },
  name_asc: { field: 'name', direction: 'asc' },
};

const getSortConfig = (sort: string) => SORT_CONFIGS[sort] ?? SORT_CONFIGS.rating_desc;

interface CatalogPageProps {
  products: Product[];
  currentPage: number;
  totalPages: number;
  globalMaxPrice: number;
  error?: string;
}

export default function CatalogPage({ products, currentPage, totalPages, globalMaxPrice, error }: CatalogPageProps) {
  const router = useRouter();
  const { addToast } = useToast(); // Use Toast
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const {
    quickViewProduct,
    openQuickView,
    closeQuickView,
    imageModalState,
    handleImageClick,
    closeImageModal,
  } = useProductModals();

  // Filter State from URL
  const { category, minPrice, maxPrice, sort } = router.query;
  
  const selectedCategories = Array.isArray(category) ? category : category ? [category] : [];
  const currentPriceRange: [number, number] = [
    Number(minPrice) || 0,
    Number(maxPrice) || globalMaxPrice
  ];
  const currentSort = (sort as any) || 'rating_desc';

  // Handlers
  const handleCategoryChange = (newCategories: string[]) => {
    const query = { ...router.query };
    delete query.category; // Clear existing
    if (newCategories.length > 0) {
      query.category = newCategories;
    }
    query.page = '1'; // Reset to first page
    router.push({ pathname: '/products', query }, undefined, { scroll: true });
  };

  const handlePriceChange = (range: [number, number]) => {
    const query = { ...router.query };
    query.minPrice = range[0].toString();
    query.maxPrice = range[1].toString();
    query.page = '1';
    router.push({ pathname: '/products', query }, undefined, { scroll: false }); 
  };

  const handleSortChange = (newSort: string) => {
    const query = { ...router.query, sort: newSort, page: '1' };
    router.push({ pathname: '/products', query }, undefined, { scroll: true });
  };

  const handleReset = () => {
    router.push('/products');
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const query = { ...router.query, page: newPage.toString() };
      router.push({ pathname: '/products', query }, undefined, { scroll: true });
    }
  };

  const handleVirtualStage = (product: Product) => {
    addToast(`Примерка AR для "${product.name}" скоро появится!`, 'info');
  };
  
  if (error) {
    return (
        <>
            <Header />
            <div className="text-center py-20 text-red-600 container mx-auto">
                <h2 className="text-2xl font-bold mb-4">Ошибка загрузки каталога</h2>
                <p>{error}</p>
                <Button className="mt-4" onClick={() => router.reload()}>Попробовать снова</Button>
            </div>
            <Footer />
        </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-serif text-brand-brown">Каталог товаров</h1>
            <Button 
                variant="outline" 
                className="md:hidden flex items-center gap-2"
                onClick={() => setIsFilterOpen(true)}
            >
                <SlidersHorizontalIcon className="w-5 h-5" />
                Фильтры
            </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full md:w-64 flex-shrink-0">
                <FilterSidebar 
                    allCategories={ALL_CATEGORIES}
                    selectedCategories={selectedCategories}
                    onCategoryChange={handleCategoryChange}
                    priceRange={currentPriceRange}
                    maxPrice={globalMaxPrice}
                    onPriceChange={handlePriceChange}
                    sortOption={currentSort}
                    onSortChange={handleSortChange}
                    onReset={handleReset}
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                />
            </aside>

            {/* Product Grid */}
            <div className="flex-grow">
                <Catalog
                    allProducts={products}
                    isLoading={false}
                    onProductSelect={(id) => router.push(`/products/${id}`)}
                    onQuickView={openQuickView}
                    onVirtualStage={handleVirtualStage} // Pass the handler
                    onImageClick={handleImageClick}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-12">
                        <Button 
                            variant="outline" 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                        </Button>
                        
                        <span className="text-brand-charcoal font-medium">
                            Страница {currentPage} из {totalPages}
                        </span>

                        <Button 
                            variant="outline" 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                        >
                            <ChevronRightIcon className="w-5 h-5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Firebase Admin SDK initialization failed.");
    }

    let globalMaxPrice = DEFAULT_MAX_PRICE;
    try {
      const maxPriceSnapshot = await adminDb.collection('products').orderBy('price', 'desc').limit(1).get();
      globalMaxPrice = maxPriceSnapshot.empty ? DEFAULT_MAX_PRICE : maxPriceSnapshot.docs[0].data().price;
    } catch (e) {
      console.log("Failed to get max price, using default", e);
    }

    const page = Number(context.query.page) || 1;
    const categoryQuery = context.query.category;
    const sortParam = (context.query.sort as string) || 'rating_desc';
    const rawMinPrice = Number(context.query.minPrice);
    const rawMaxPrice = Number(context.query.maxPrice);

    const hasMinPriceFilter = !Number.isNaN(rawMinPrice) && rawMinPrice > 0;
    const hasMaxPriceFilter = !Number.isNaN(rawMaxPrice) && rawMaxPrice > 0 && rawMaxPrice < globalMaxPrice;
    const minPriceFilter = hasMinPriceFilter ? rawMinPrice : undefined;
    const maxPriceFilter = hasMaxPriceFilter ? rawMaxPrice : undefined;
    const isPriceFilterActive = Boolean(minPriceFilter !== undefined || maxPriceFilter !== undefined);

    const selectedCategories = Array.isArray(categoryQuery)
      ? (categoryQuery as string[])
      : categoryQuery
        ? [categoryQuery as string]
        : [];

    let baseQuery = adminDb.collection('products');
    if (selectedCategories.length > 0) {
      if (selectedCategories.length === 1) {
        baseQuery = baseQuery.where('category', '==', selectedCategories[0]);
      } else {
        baseQuery = baseQuery.where('category', 'in', selectedCategories.slice(0, CATEGORY_IN_LIMIT));
      }
    }

    const sortConfig = getSortConfig(sortParam);
    const canApplyPriceFilterInQuery = isPriceFilterActive && (sortParam === 'price_asc' || sortParam === 'price_desc');
    const shouldUseLegacyPipeline = sortParam === 'discount_desc' || (isPriceFilterActive && !canApplyPriceFilterInQuery);

    if (!shouldUseLegacyPipeline) {
      let filteredQuery = baseQuery;
      if (canApplyPriceFilterInQuery) {
        if (typeof minPriceFilter === 'number') {
          filteredQuery = filteredQuery.where('price', '>=', minPriceFilter);
        }
        if (typeof maxPriceFilter === 'number') {
          filteredQuery = filteredQuery.where('price', '<=', maxPriceFilter);
        }
      }

      const totalItemsSnapshot = await filteredQuery.count().get();
      const totalItems = totalItemsSnapshot.data().count ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
      const safePage = Math.max(1, Math.min(page, totalPages));
      const offset = (safePage - 1) * ITEMS_PER_PAGE;

      const sortedQuery = filteredQuery.orderBy(sortConfig.field, sortConfig.direction);
      const pageSnapshot = await sortedQuery.offset(offset).limit(ITEMS_PER_PAGE).get();
      const products = pageSnapshot.docs.map(doc => {
        const data = doc.data() as Product;
        const imageUrls = (data.imageUrls || []).map(url => url || '/placeholder.svg');
        return { ...data, id: doc.id, imageUrls };
      });

      return {
        props: {
          products: JSON.parse(JSON.stringify(products)),
          currentPage: safePage,
          totalPages,
          globalMaxPrice,
        },
      };
    }

    // Legacy: fallback for discount sort and incompatible price filter combinations.
    const legacySnapshot = await baseQuery.get();
    let productsData = legacySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];

    if (isPriceFilterActive) {
      productsData = productsData.filter(product => {
        const price = product.price || 0;
        const matchesMin = typeof minPriceFilter === 'number' ? price >= minPriceFilter : true;
        const matchesMax = typeof maxPriceFilter === 'number' ? price <= maxPriceFilter : true;
        return matchesMin && matchesMax;
      });
    }

    const sortHandlers: Record<string, (a: Product, b: Product) => number> = {
      price_asc: (a, b) => (a.price ?? 0) - (b.price ?? 0),
      price_desc: (a, b) => (b.price ?? 0) - (a.price ?? 0),
      rating_desc: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
      name_asc: (a, b) => a.name.localeCompare(b.name),
      discount_desc: (a, b) => {
        const discountA = a.originalPrice && a.price ? a.originalPrice - a.price : 0;
        const discountB = b.originalPrice && b.price ? b.originalPrice - b.price : 0;
        return discountB - discountA;
      },
    };

    productsData.sort(sortHandlers[sortParam] ?? sortHandlers.rating_desc);

    const totalItems = productsData.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const safePage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = productsData
      .slice(startIndex, startIndex + ITEMS_PER_PAGE)
      .map(product => ({
        ...product,
        imageUrls: (product.imageUrls || []).map(url => url || '/placeholder.svg'),
      }));

    return {
      props: {
        products: JSON.parse(JSON.stringify(paginatedProducts)),
        currentPage: safePage,
        totalPages,
        globalMaxPrice,
      },
    };
  } catch (error) {
    console.error("Catalog Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    return { 
        props: { 
            products: [], 
            currentPage: 1, 
            totalPages: 1, 
            globalMaxPrice: 1000000,
            error: errorMessage 
        } 
    };
  }
};
