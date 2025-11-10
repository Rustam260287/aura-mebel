// pages/products/[id].tsx
import { GetServerSideProps } from 'next';
import { getAdminDb } from '../../lib/firebaseAdmin';
import type { Product } from '../../types';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { ProductDetail } from '../../components/ProductDetail';

// Динамически импортируем клиентские компоненты, чтобы избежать ошибок гидратации
const Header = dynamic(() => import('../../components/Header').then(mod => mod.Header), { ssr: false });
const Footer = dynamic(() => import('../../components/Footer').then(mod => mod.Footer), { ssr: false });
// ... и любые другие клиентские компоненты, которые могут понадобиться ...

interface ProductPageProps {
  product?: Product;
  error?: string;
}

export default function ProductPage({ product, error }: ProductPageProps) {
  const router = useRouter();

  // Если сервер вернул ошибку или товар не найден
  if (error || !product) {
    return (
      <div>
        <h1>Ошибка</h1>
        <p>{error || "Товар не найден."}</p>
        <button onClick={() => router.back()}>Назад</button>
      </div>
    );
  }

  // TODO: Заменить на Next.js router
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
  const dbAdmin = getAdminDb();

  if (!dbAdmin) {
    return { props: { error: "Database connection failed." } };
  }

  try {
    const productDoc = await dbAdmin.collection('products').doc(id as string).get();

    if (!productDoc.exists) {
      return { notFound: true }; // Возвращает 404 страницу
    }

    const product = productDoc.data();

    return {
      props: {
        product: JSON.parse(JSON.stringify(product)),
      },
    };
  } catch (error) {
    return {
      props: { error: "Failed to fetch product data." },
    };
  }
};
