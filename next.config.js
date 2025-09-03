/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (!dev && (process.env.CI === 'true' || process.env.NEXT_DISABLE_WEBPACK_CACHE === '1')) {
      config.cache = false;
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  optimizeFonts: false,
};

module.exports = nextConfig;
