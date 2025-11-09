import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  sassOptions: {
    implementation: 'sass',
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
