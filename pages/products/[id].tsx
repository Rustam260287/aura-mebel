
// pages/products/[id].tsx
import { GetServerSideProps } from 'next';
import { getAdminDb, getAdminStorage } from '../../lib/firebaseAdmin'; // Обновленный импорт
import type { Product } from '../../types';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { ProductDetail } from '../../components/ProductDetail';

const Header = dynamic(() => import('../../components/Header').then(mod => mod.Header), { ssr: false });
const Footer = dynamic(() => import('../../components/Footer').then(mod => mod.Footer), { ssr: false });

interface ProductPageProps {
  product?: Product;
  error?: string;
}

export default function ProductPage({ product, error }: ProductPageProps) {
  const router = useRouter();

  if (error) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-red-600">Ошибка загрузки товара</h1>
        <p>{error}</p>
        <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">На главную</button>
      </div>
    );
  }

  if (!product) {
     return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Товар не найден</h1>
        <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">На главную</button>
      </div>
    );
  }

  const handleNavigate = (view: any) => router.push('/');

  return (
    <>
      <Header onNavigate={handleNavigate} onStyleFinderClick={() => {}} />
      <main>
        <ProductDetail product={product} onBack={() => router.back()} />
      </main>
      <Footer onNavigate={handleNavigate} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params;
  const adminDb = getAdminDb(); // Вызываем функцию
  const adminStorage = getAdminStorage(); // Вызываем функцию

  if (!adminDb || !adminStorage) {
    return { props: { error: "Firebase Admin SDK initialization failed." } };
  }

  try {
    const productDoc = await adminDb.collection('products').doc(id as string).get();

    if (!productDoc.exists) {
      return { notFound: true };
    }

    const productData = { id: productDoc.id, ...productDoc.data() } as Product;

    if (Array.isArray(productData.imageUrls)) {
        const bucket = adminStorage.bucket();
        productData.imageUrls = await Promise.all(productData.imageUrls.map(async (url) => {
            if (url && url.startsWith('gs://')) { // Добавлена проверка
                const path = url.substring(url.indexOf('/', 5) + 1);
                try {
                    const [signedUrl] = await bucket.file(path).getSignedUrl({
                        action: 'read',
                        expires: '03-09-2491'
                    });
                    return signedUrl;
                } catch (e) {
                    console.error(`Error getting signed URL for ${path}:`, e.message);
                    return '/placeholder.svg';
                }
            }
            return url || '/placeholder.svg';
        }));
    } else {
        productData.imageUrls = ['/placeholder.svg'];
    }
    
    delete (productData as any).imageUrl;

    return {
      props: {
        product: JSON.parse(JSON.stringify(productData)),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return {
      props: { error: `Failed to fetch product data: ${errorMessage}` },
    };
  }
};
