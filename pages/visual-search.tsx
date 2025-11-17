// pages/visual-search.tsx
import { GetStaticProps } from 'next';
import { getAdminDb } from '../lib/firebaseAdmin';
import type { Product } from '../types';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

import { VisualSearchPage } from '../components/VisualSearchPage'; // Используем ваш существующий компонент
import { Footer } from '../components/Footer';

const Header = dynamic(() => import('../components/Header').then(mod => mod.Header), { ssr: false });

interface VisualSearchProps {
  allProducts: Product[];
}

export default function VisualSearch({ allProducts }: VisualSearchProps) {
  const router = useRouter();

  return (
    <>
      <Header onStyleFinderClick={() => {}} />
      <main>
        <VisualSearchPage allProducts={allProducts} onProductSelect={(id) => router.push(`/products/${id}`)} />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const dbAdmin = getAdminDb();
  if (!dbAdmin) {
    return { props: { allProducts: [] } };
  }

  try {
    const productsSnapshot = await dbAdmin.collection('products').get();
    const allProducts = productsSnapshot.docs.map(doc => doc.data());
    return {
      props: { allProducts: JSON.parse(JSON.stringify(allProducts)) },
    };
  } catch (error) {
    console.error("Error fetching products for visual search:", error);
    return { props: { allProducts: [] } };
  }
};
