
/** @type {import('next').NextConfig} */
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    scrollRestoration: true,
  },
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: 'oaidalleapiprodscus.blob.core.windows.net' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'replicate.delivery' },
      // ДОБАВЛЕНО: домен для изображений товаров
      { protocol: 'https', hostname: 'label-com.ru' }, 
    ],
  },
  devIndicators: {
    buildActivity: true,
  }
};

export default withPWA(nextConfig);
