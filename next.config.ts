import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactStrictMode: true,
  // 로컬에서 hosts 매핑된 도메인으로 dev server에 접근할 때 _next/webpack-hmr 등이
  // cross-origin으로 차단되지 않도록 명시 허용. (Next 16 보안 기본값 보완)
  allowedDevOrigins: ['local-hotpick.votebox.kr', 'local-console.votebox.kr'],
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
      {
        protocol: 'https',
        hostname: 'oogqjrgao2pait6w.public.blob.vercel-storage.com',
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
