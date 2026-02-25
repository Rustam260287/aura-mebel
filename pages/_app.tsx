
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ClientProviders } from '../components/ClientProviders';
import Head from 'next/head';

import { AuraField } from '../components/AuraField';
import { MobileHeader } from '../components/MobileHeader';
import { InAppBrowserGate } from '../components/InAppBrowserGate';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>
      <AuraField />
      <ClientProviders>
        <InAppBrowserGate>
          <MobileHeader />
          <Component {...pageProps} />
        </InAppBrowserGate>
      </ClientProviders>
    </>
  );
}

export default MyApp;
