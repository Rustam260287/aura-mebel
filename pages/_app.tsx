
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ClientProviders } from '../components/ClientProviders';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>
      <ClientProviders>
        <Component {...pageProps} />
      </ClientProviders>
    </>
  );
}

export default MyApp;
