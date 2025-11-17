/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['picsum.photos'],
  },
  devIndicators: {
    buildActivity: true,
    allowedDevOrigins: ["https://3000-firebase-aura-mebelgit-1763209593259.cluster-cbeiita7rbe7iuwhvjs5zww2i4.cloudworkstations.dev"]
  }
};

export default nextConfig;
