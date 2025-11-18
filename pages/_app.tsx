
// pages/_app.tsx
import '../styles/globals.css';
import '../firebaseConfig';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import Head from 'next/head';

// ClientProviders больше не нужен для AI, но может быть полезен для других клиентских контекстов
const ClientProviders = dynamic(() => 
  import('../components/ClientProviders').then(mod => mod.ClientProviders), 
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <Head>
          <title>Aura Мебель</title>
        </Head>
        {/* Оставляем ClientProviders на случай будущих расширений */}
        <ClientProviders>
          <div className="flex flex-col min-h-screen font-sans bg-brand-cream text-brand-charcoal">
            <Component {...pageProps} />
          </div>
        </ClientProviders>
      </ToastProvider>
    </AuthProvider>
  );
}

export default MyApp;
