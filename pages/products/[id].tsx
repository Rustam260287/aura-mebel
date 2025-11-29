
// pages/products/[id].tsx
import { GetStaticPaths, GetStaticProps } from 'next';
import { getAdminDb, getAdminStorage } from '../../lib/firebaseAdmin';
import type { Product } from '../../types';
import { useRouter } from 'next/router';
import { ProductDetail } from '../../components/ProductDetail';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { SEO } from '../../components/SEO';

interface ProductPageProps {
  product?: Product;
  error?: string;
}

export default function ProductPage({ product, error }: ProductPageProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Загрузка...</div>;
  }

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

  // Формируем SEO данные
  // Если есть специальное seoDescription, используем его. Иначе берем начало обычного описания.
  const descriptionText = product.seoDescription || product.description || '';
  const seoDescription = descriptionText.length > 160 
    ? descriptionText.substring(0, 157) + '...' 
    : descriptionText;
    
  const seoImage = (product.imageUrls && product.imageUrls.length > 0) 
    ? product.imageUrls[0] 
    : undefined;

  return (
    <>
      <SEO 
        title={product.name} 
        description={seoDescription || `Купить ${product.name} по выгодной цене.`}
        image={seoImage}
        url={`/products/${product.id}`}
      />
      <Header />
      <main>
        <ProductDetail 
          product={product} 
          onBack={() => router.back()}
        />
      </main>
      <Footer />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
    const adminDb = getAdminDb();
    if (!adminDb) {
        return { paths: [], fallback: true }; // Используем fallback: true
    }
    const productsSnapshot = await adminDb.collection('products').get();
    const paths = productsSnapshot.docs.map(doc => ({
        params: { id: doc.id },
    }));
    return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { params } = context;
  if (!params?.id) {
    return { props: { error: "Product ID not found." } };
  }
  const { id } = params;
  const adminDb = getAdminDb();
  const adminStorage = getAdminStorage();

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
    } else {
        productData.imageUrls = ['/placeholder.svg'];
    }
    
    return {
      props: {
        product: JSON.parse(JSON.stringify(productData)),
      },
      revalidate: 60,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return {
      props: { error: `Failed to fetch product data: ${errorMessage}` },
    };
  }
};
