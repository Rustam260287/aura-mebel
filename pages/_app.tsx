// pages/_app.tsx
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { ToastProvider } from '../contexts/ToastContext';
import '../styles/globals.css';
import Head from 'next/head';

const ClientProviders = dynamic(() => 
  import('../components/ClientProviders').then(mod => mod.ClientProviders), 
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  const { allProducts = [] } = pageProps;

  const handleChatSessionEnd = (sessionMessages: any[]) => {
    console.log('Chat session ended:', sessionMessages);
  };

  return (
    <ToastProvider>
      <Head>
        <title>Aura Мебель</title>
      </Head>
      <ClientProviders allProducts={allProducts} onSessionEnd={handleChatSessionEnd}>
        <div className="flex flex-col min-h-screen font-sans bg-brand-cream text-brand-charcoal">
          <Component {...pageProps} />
        </div>
      </ClientProviders>
    </ToastProvider>
  );
}

export default MyApp;
