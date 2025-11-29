
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

const QuickViewModal = dynamic(() => import('../../components/QuickViewModal').then(mod => mod.QuickViewModal), { ssr: false });

const ITEMS_PER_PAGE = 12;
const ALL_CATEGORIES = ['Спальни', 'Кухни', 'Мягкая мебель', 'Гостиная'];

interface CatalogPageProps {
  products: Product[];
  currentPage: number;
  totalPages: number;
  globalMaxPrice: number;
  error?: string;
}

export default function CatalogPage({ products, currentPage, totalPages, globalMaxPrice, error }: CatalogPageProps) {
  const router = useRouter();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
                    onQuickView={setQuickViewProduct}
                    onVirtualStage={() => {}}
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

      {quickViewProduct && <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onViewDetails={(id) => router.push(`/products/${id}`)} />}
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Firebase Admin SDK initialization failed.");
    }

    // 1. Get Global Max Price for Filters
    // Note: This query is cheap and usually indexed
    let globalMaxPrice = 1000000;
    try {
        const maxPriceSnapshot = await adminDb.collection('products').orderBy('price', 'desc').limit(1).get();
        globalMaxPrice = maxPriceSnapshot.empty ? 1000000 : maxPriceSnapshot.docs[0].data().price;
    } catch (e) {
        console.log("Failed to get max price, using default", e);
    }

    // 2. Build Query - STRATEGY: Fetch Filtered by Category, do the rest in memory to avoid Index Hell
    let query: FirebaseFirestore.Query = adminDb.collection('products');
    
    // Params
    const page = Number(context.query.page) || 1;
    const categoryQuery = context.query.category;
    const minPrice = Number(context.query.minPrice);
    const maxPrice = Number(context.query.maxPrice);
    const sort = context.query.sort as string || 'rating_desc';

    // Filter: Category (DB Level)
    let selectedCategories: string[] = [];
    if (Array.isArray(categoryQuery)) {
        selectedCategories = categoryQuery as string[];
    } else if (categoryQuery) {
        selectedCategories = [categoryQuery as string];
    }

    if (selectedCategories.length > 0) {
        if (selectedCategories.length === 1) {
             query = query.where('category', '==', selectedCategories[0]);
        } else {
             query = query.where('category', 'in', selectedCategories.slice(0, 10)); 
        }
    }

    // Fetch ALL matching items (without limit/offset for now, to sort in memory)
    // Assuming catalog < 1000 items, this is fine.
    const snapshot = await query.get();
    let productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];

    // 3. Filter: Price (Memory Level)
    const isPriceFiltered = !isNaN(minPrice) || (!isNaN(maxPrice) && maxPrice < globalMaxPrice);
    if (isPriceFiltered) {
        productsData = productsData.filter(p => {
            const price = p.price || 0;
            const min = !isNaN(minPrice) ? minPrice : 0;
            const max = !isNaN(maxPrice) ? maxPrice : Infinity;
            return price >= min && price <= max;
        });
    }

    // 4. Sort (Memory Level)
    productsData.sort((a, b) => {
        if (sort === 'price_asc') {
            return a.price - b.price;
        } else if (sort === 'price_desc') {
            return b.price - a.price;
        } else if (sort === 'rating_desc') {
            return (b.rating || 0) - (a.rating || 0);
        } else if (sort === 'name_asc') {
            return a.name.localeCompare(b.name);
        } else if (sort === 'discount_desc') {
             // Assuming discount calculation
             const discountA = a.originalPrice ? (a.originalPrice - a.price) : 0;
             const discountB = b.originalPrice ? (b.originalPrice - b.price) : 0;
             return discountB - discountA;
        }
        return 0;
    });

    // 5. Pagination (Memory Level)
    const totalItems = productsData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    // Handle out of bounds page
    const safePage = Math.max(1, Math.min(page, totalPages || 1));
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    const paginatedProducts = productsData.slice(startIndex, endIndex);

    const products = paginatedProducts.map(product => {
      const imageUrls = (product.imageUrls || []).map(url => url || '/placeholder.svg');
      return { ...product, imageUrls };
    });
    
    return {
      props: { 
        products: JSON.parse(JSON.stringify(products)),
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
