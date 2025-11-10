/** @type {import('next').NextConfig} */
const nextConfig = {
  // Включаем экспериментальную поддержку PostCSS v8
  // для совместимости с Tailwind CSS v4
  experimental: {
    postcss: true,
  },
};

export default nextConfig;
