'use client';

import { useState, type ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { getQueryClient } from '@/lib/react-query';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * React Query Provider
 * - useState로 QueryClient를 생성하여 SSR hydration 안정성 확보
 * - React 18+ 권장 패턴
 */
export const QueryProvider = ({ children }: QueryProviderProps) => {
  // useState로 클라이언트마다 새 QueryClient 생성 (권장)
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 환경에서만 DevTools 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
};
