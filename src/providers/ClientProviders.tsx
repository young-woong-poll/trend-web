'use client';

import type { ReactNode } from 'react';

import dynamic from 'next/dynamic';

// MSWProvider는 개발 환경에서만 동적 로드 (프로덕션 번들에서 제외)
const MSWProvider =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@/providers/MSWProvider').then((mod) => mod.MSWProvider), {
        ssr: false,
      })
    : ({ children }: { children: ReactNode }) => children;

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * Client Providers Wrapper
 * 클라이언트 전용 Provider들을 래핑합니다
 */
export const ClientProviders = ({ children }: ClientProvidersProps) => (
  <MSWProvider>{children}</MSWProvider>
);
