import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactStrictMode: true,
  sassOptions: {
    implementation: 'sass',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.votebox.kr',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'trend-image.votebox.kr',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  // Turbopack configuration (required when using webpack config in Next.js 16)
  turbopack: {},
  // Enable HMR optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Enable fast refresh
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
