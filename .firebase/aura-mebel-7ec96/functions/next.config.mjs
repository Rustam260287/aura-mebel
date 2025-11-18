// next.config.mjs
var nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**"
      }
    ]
  },
  devIndicators: {
    buildActivity: true,
    allowedDevOrigins: ["https://3000-firebase-aura-mebelgit-1763209593259.cluster-cbeiita7rbe7iuwhvjs5zww2i4.cloudworkstations.dev"]
  }
};
var next_config_default = nextConfig;
export {
  next_config_default as default
};
