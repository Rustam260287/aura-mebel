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
  turbopack: {}, // Silences the "using webpack with no turbopack config" error
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com', // Added for Admin SDK uploaded images
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'aura-mebel-7ec96.firebasestorage.app', // Added for safety
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'label-com.ru',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    buildActivity: true,
    // allowedDevOrigins is dynamically managed in some environments, but we keep it here
  }
};

export default withPWA(nextConfig);
