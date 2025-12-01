
// pages/_app.tsx
import '../styles/globals.css';
import '../firebaseConfig';
import type { AppProps } from 'next/app';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ClientProviders } from '../components/ClientProviders';
import { ChatWidget } from '../components/ChatWidget';
import Head from 'next/head';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <AuthProvider>
      <ToastProvider>
        <Head>
          <title>Labelcom Мебель</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        </Head>
        <ClientProviders>
          <div className="flex flex-col min-h-screen font-sans bg-[#FBF9F4] text-brand-charcoal selection:bg-brand-brown/20 selection:text-brand-brown">
             {/* Key меняется при смене роута, запуская анимацию заново */}
             <div key={router.asPath} className="animate-fade-in-up flex-grow flex flex-col">
                <Component {...pageProps} />
             </div>
            <ChatWidget />
          </div>
        </ClientProviders>
      </ToastProvider>
    </AuthProvider>
  );
}

export default MyApp;
