/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
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

export default nextConfig;
