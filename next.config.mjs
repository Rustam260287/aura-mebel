
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
  typescript: {
    ignoreBuildErrors: false,
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
      { protocol: 'https', hostname: 'placehold.co' },
      // Домен для изображений (legacy assets)
      { protocol: 'https', hostname: 'label-com.ru' },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async redirects() {
    return [
      { source: '/products', destination: '/objects', permanent: true },
      { source: '/products/:path*', destination: '/objects/:path*', permanent: true },
      { source: '/wishlist', destination: '/saved', permanent: true },
      { source: '/blog', destination: '/journal', permanent: true },
      { source: '/blog/:path*', destination: '/journal/:path*', permanent: true },
    ];
  },
  devIndicators: {
    buildActivity: true,
  }
};

export default withPWA(nextConfig);
