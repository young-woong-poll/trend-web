import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
        hostname: 'picsum.photos',
      },
    ],
  },
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
