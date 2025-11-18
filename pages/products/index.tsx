// pages/products/index.tsx
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { getAdminDb, getAdminStorage } from '../../lib/firebaseAdmin';
import type { Product } from '../../types';

import { Catalog } from '../../components/Catalog';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

const QuickViewModal = dynamic(() => import('../../components/QuickViewModal').then(mod => mod.QuickViewModal), { ssr: false });

interface CatalogPageProps {
  allProducts: Product[];
  error?: string;
}

export default function CatalogPage({ allProducts, error }: CatalogPageProps) {
  const router = useRouter();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const isLoading = router.isFallback;

  if (error) {
    return <div className="text-center py-20 text-red-600">Ошибка: {error}</div>;
  }
  
  const initialCategory = typeof router.query.category === 'string' ? router.query.category : undefined;

  return (
    <>
      <Header />
      <main className="flex-grow">
        <Catalog
          allProducts={allProducts}
          isLoading={isLoading}
          onProductSelect={(id) => router.push(`/products/${id}`)}
          onQuickView={setQuickViewProduct}
          onVirtualStage={() => {}} // Пустая функция
          initialCategory={initialCategory}
        />
      </main>
      <Footer />

      {quickViewProduct && <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onViewDetails={(id) => router.push(`/products/${id}`)} />}
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const adminDb = getAdminDb();
    const adminStorage = getAdminStorage();

    if (!adminDb || !adminStorage) {
      throw new Error("Firebase Admin SDK initialization failed.");
    }

    const productsSnapshot = await adminDb.collection('products').get();
    const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];

    const bucket = adminStorage.bucket();
    
    const allProducts = await Promise.all(productsData.map(async (product) => {
      if (!Array.isArray(product.imageUrls)) {
        return { ...product, imageUrls: ['/placeholder.svg'] };
      }
      
      const imageUrls = await Promise.all(product.imageUrls.map(async (url) => {
        if (url && url.startsWith('gs://')) {
          const path = url.substring(url.indexOf('/', 5) + 1);
          try {
            const [signedUrl] = await bucket.file(path).getSignedUrl({
              action: 'read',
              expires: '03-09-2491'
            });
            return signedUrl;
          } catch (e) {
            console.error(`Error getting signed URL for ${path}:`, e instanceof Error ? e.message : e);
            return '/placeholder.svg';
          }
        }
        return url || '/placeholder.svg';
      }));
      
      return { ...product, imageUrls };
    }));
    
    return {
      props: { allProducts: JSON.parse(JSON.stringify(allProducts)) },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching data for catalog:", error);
    return { props: { allProducts: [], error: error instanceof Error ? error.message : "An unknown error occurred" } };
  }
};
