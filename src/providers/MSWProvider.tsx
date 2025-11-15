'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface MSWProviderProps {
  children: ReactNode;
}

/**
 * MSW Provider
 * 개발 환경에서 MSW를 초기화합니다
 */
export const MSWProvider = ({ children }: MSWProviderProps) => {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    const initMSW = async () => {
      // 개발 환경이고 MSW가 활성화된 경우에만 실행
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_MSW === 'true') {
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'bypass', // 처리되지 않은 요청은 실제 API로 전달
        });
      }
      setMswReady(true);
    };

    void initMSW();
  }, []);

  // MSW가 준비될 때까지 children을 렌더링하지 않음
  if (!mswReady) {
    return null;
  }

  return <>{children}</>;
};
