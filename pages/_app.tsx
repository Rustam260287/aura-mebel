
// pages/_app.tsx
import '../firebaseConfig';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext'; // Импортируем AuthProvider
import '../styles/globals.css';
import Head from 'next/head';
import { ChatMessage } from '../contexts/AiChatContext';

const ClientProviders = dynamic(() => 
  import('../components/ClientProviders').then(mod => mod.ClientProviders), 
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  const { allProducts = [] } = pageProps;

  const handleChatSessionEnd = (sessionMessages: ChatMessage[]) => {
    console.log('Chat session ended:', sessionMessages);
  };

  return (
    <AuthProvider> {/* Оборачиваем все в AuthProvider */}
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
    </AuthProvider>
  );
}

export default MyApp;
