
// pages/_app.tsx
import '../styles/globals.css';
import '../firebaseConfig';
import type { AppProps } from 'next/app';
// import dynamic from 'next/dynamic'; // Убираем dynamic
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ClientProviders } from '../components/ClientProviders'; // Импортируем напрямую
import Head from 'next/head';

// ClientProviders теперь импортируется синхронно, что гарантирует готовность контекста

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <Head>
          <title>Labelcom Мебель</title>
        </Head>
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
