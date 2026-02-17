'use client';

import type { ReactNode } from 'react';

import dynamic from 'next/dynamic';

// TODO: 임시 - 프로덕션에서도 MSW 포함 (BE API 미구현)
const MSWProvider = dynamic(
  () => import('@/providers/MSWProvider').then((mod) => mod.MSWProvider),
  { ssr: false }
);

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
