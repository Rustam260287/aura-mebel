// pages/ai-room-makeover.tsx
import { GetServerSideProps } from 'next';
import { getAdminDb } from '../lib/firebaseAdmin';
import type { Product, View } from '../types';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Используем ваш существующий компонент
import { AiRoomMakeoverPage } from '../components/AiRoomMakeoverPage'; 
import { Footer } from '../components/Footer';

const Header = dynamic(() => import('../components/Header').then(mod => mod.Header), { ssr: false });

interface AiRoomMakeoverProps {
  allProducts: Product[];
}

export default function AiRoomMakeover({ allProducts }: AiRoomMakeoverProps) {
  const router = useRouter();

  const handleNavigate = (view: View) => {
    if (view.page === 'product') {
      router.push(`/products/${view.productId}`);
    } else {
      router.push('/'); // Возврат на главную
    }
  };

  return (
    <>
      <Header onNavigate={handleNavigate} onStyleFinderClick={() => {}} />
      <main>
        <AiRoomMakeoverPage allProducts={allProducts} onNavigate={handleNavigate} />
      </main>
      <Footer onNavigate={handleNavigate} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
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
    console.error("Error fetching products for AI Room Makeover:", error);
    return { props: { allProducts: [] } };
  }
};
