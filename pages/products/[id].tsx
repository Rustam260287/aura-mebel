
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
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-brown"></div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Header />
        <div className="text-center py-20 px-4">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка загрузки товара</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={() => router.push('/products')} className="px-6 py-3 bg-brand-brown text-white rounded-lg hover:bg-brand-brown/90 transition-colors">
                Вернуться в каталог
            </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Header />
        <div className="text-center py-20 px-4">
            <h1 className="text-3xl font-serif text-brand-charcoal mb-4">Товар не найден</h1>
            <p className="text-gray-500 mb-8">К сожалению, запрашиваемый товар не существует или был удален.</p>
            <button onClick={() => router.push('/products')} className="px-6 py-3 bg-brand-brown text-white rounded-lg hover:bg-brand-brown/90 transition-colors">
                Перейти в каталог
            </button>
        </div>
        <Footer />
      </div>
    );
  }

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
      <main className="bg-white min-h-screen">
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
        return { paths: [], fallback: 'blocking' };
    }
    
    try {
        const productsSnapshot = await adminDb.collection('products').select().get();
        const paths = productsSnapshot.docs.map(doc => ({
            params: { id: doc.id },
        }));
        
        return { paths, fallback: 'blocking' };
    } catch (e) {
        console.error("Error generating paths:", e);
        return { paths: [], fallback: 'blocking' };
    }
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { params } = context;
  if (!params?.id) {
    return { props: { error: "Product ID not found." } };
  }
  const { id } = params;
  
  // Разрешаем любые ID, так как теперь мы ищем и по slug
  const adminDb = getAdminDb();
  const adminStorage = getAdminStorage();

  if (!adminDb || !adminStorage) {
    return { props: { error: "Firebase Admin SDK initialization failed." } };
  }

  try {
    let productDocSnapshot;
    let productId = id as string;

    // 1. Попытка найти по ID документа (стандартный Firestore ID)
    const docRef = adminDb.collection('products').doc(productId);
    productDocSnapshot = await docRef.get();

    // 2. Если не найдено, пробуем найти по полю 'id' (slug из старого импорта)
    if (!productDocSnapshot.exists) {
        console.log(`Product with doc ID ${productId} not found. Searching by 'id' field...`);
        const querySnapshot = await adminDb.collection('products').where('id', '==', productId).limit(1).get();
        
        if (!querySnapshot.empty) {
            productDocSnapshot = querySnapshot.docs[0];
            // Важно: используем реальный ID документа для дальнейшей работы, 
            // но в объект продукта запишем тот ID, который ожидает клиент (или реальный)
            // Лучше использовать реальный ID документа как основной.
        }
    }

    if (!productDocSnapshot || !productDocSnapshot.exists) {
      return { notFound: true };
    }

    // Собираем данные. Приоритет ID: реальный ключ документа
    const productData = { 
        ...productDocSnapshot.data(), 
        id: productDocSnapshot.id // Перезаписываем id, чтобы он всегда был ключом документа
    } as Product;

    // Обработка картинок
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
    console.error(`Error fetching product ${id}:`, errorMessage);
    return {
      props: { error: `Не удалось загрузить товар. Возможно, он был удален.` },
    };
  }
};
