'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface MSWProviderProps {
  children: ReactNode;
}

/**
 * MSW Provider
 * 클라이언트 환경에서 MSW를 초기화합니다.
 * SSR 하이드레이션 데이터를 유지하기 위해 children은 즉시 렌더링합니다.
 */
export const MSWProvider = ({ children }: MSWProviderProps) => {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    const init = async () => {
      if (process.env.NEXT_PUBLIC_ENABLE_MSW === 'true') {
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'bypass',
        });
        // eslint-disable-next-line no-console
        console.log('[MSW] Browser-side mocking enabled');
      }
    };

    void init();
  }, []);

  return <>{children}</>;
};
