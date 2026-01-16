'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface MSWProviderProps {
  children: ReactNode;
}

/**
 * MSW Provider
 * 클라이언트 환경에서 MSW를 초기화합니다
 */
export const MSWProvider = ({ children }: MSWProviderProps) => {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      // 클라이언트에서 MSW가 활성화된 경우에만 실행
      if (process.env.NEXT_PUBLIC_ENABLE_MSW === 'true') {
        // browser.ts만 직접 import (server.ts 참조 방지)
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'bypass',
        });
        // eslint-disable-next-line no-console
        console.log('[MSW] Browser-side mocking enabled');
      }
      setMswReady(true);
    };

    void init();
  }, []);

  // MSW가 준비될 때까지 children을 렌더링하지 않음
  if (!mswReady) {
    return null;
  }

  return <>{children}</>;
};
