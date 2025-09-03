/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    // Turn off FS cache to avoid rename errors in Bolt publish containers
    config.cache = false;
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  optimizeFonts: false,
};

module.exports = nextConfig;
