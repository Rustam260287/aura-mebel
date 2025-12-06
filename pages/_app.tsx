
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ClientProviders } from '../components/ClientProviders';

// Теперь _app.tsx — это простой серверный компонент, 
// а вся клиентская логика находится в ClientProviders.
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClientProviders>
      <Component {...pageProps} />
    </ClientProviders>
  );
}

export default MyApp;
