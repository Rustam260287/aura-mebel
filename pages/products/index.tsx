
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
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';

const QuickViewModal = dynamic(() => import('../../components/QuickViewModal').then(mod => mod.QuickViewModal), { ssr: false });

const ITEMS_PER_PAGE = 12;

interface CatalogPageProps {
  products: Product[];
  currentPage: number;
  totalPages: number;
  error?: string;
}

export default function CatalogPage({ products, currentPage, totalPages, error }: CatalogPageProps) {
  const router = useRouter();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  if (error) {
    return <div className="text-center py-20 text-red-600">Ошибка: {error}</div>;
  }
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const query = { ...router.query, page: newPage.toString() };
      router.push({ pathname: '/products', query }, undefined, { scroll: true });
    }
  };

  return (
    <>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif text-brand-brown mb-8">Каталог товаров</h1>
        
        <Catalog
          allProducts={products}
          isLoading={false}
          onProductSelect={(id) => router.push(`/products/${id}`)}
          onQuickView={setQuickViewProduct}
          onVirtualStage={() => {}}
        />

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

    const page = Number(context.query.page) || 1;
    
    const allDocsSnapshot = await adminDb.collection('products').select('id').get();
    const totalItems = allDocsSnapshot.size;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const productsSnapshot = await adminDb.collection('products')
      .offset((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .get();

    const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];

    const products = productsData.map(product => {
      const imageUrls = (product.imageUrls || []).map(url => url || '/placeholder.svg');
      return { ...product, imageUrls };
    });
    
    return {
      props: { 
        products: JSON.parse(JSON.stringify(products)),
        currentPage: page,
        totalPages
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { props: { products: [], currentPage: 1, totalPages: 1, error: errorMessage } };
  }
};
