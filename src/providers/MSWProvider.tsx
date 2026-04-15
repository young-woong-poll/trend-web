'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const isMSWEnabled = process.env.NEXT_PUBLIC_ENABLE_MSW === 'true';

interface MSWProviderProps {
  children: ReactNode;
}

/**
 * MSW Provider (dev 전용)
 *
 * worker가 준비되기 전에는 children을 마운트하지 않는다.
 * 덕분에 하위 컴포넌트/훅은 "마운트된 시점엔 MSW가 이미 준비되어 있다"는
 * 전제만 믿고 동작할 수 있다 — 각자 mswReady를 확인할 필요가 없다.
 *
 * NEXT_PUBLIC_ENABLE_MSW !== 'true' 인 경우 즉시 children 렌더 (fallback 경로 무효화).
 * 프로덕션 빌드에서는 이 파일 자체가 ClientProviders에서 pass-through로 교체됨.
 */
export const MSWProvider = ({ children }: MSWProviderProps) => {
  const started = useRef(false);
  const [isReady, setIsReady] = useState(!isMSWEnabled);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    const init = async () => {
      if (isMSWEnabled) {
        const { worker } = await import('@/mocks/browser');
        const msw = await import('msw');
        await worker.start({
          onUnhandledRequest: 'bypass',
        });
        // E2E 테스트에서 worker.use()로 핸들러 오버라이드 가능하도록 노출
        (window as Record<string, unknown>).__mswWorker = worker;
        (window as Record<string, unknown>).__mswHttp = msw.http;
        (window as Record<string, unknown>).__mswHttpResponse = msw.HttpResponse;
        // eslint-disable-next-line no-console
        console.log('[MSW] Browser-side mocking enabled');
        setIsReady(true);
      }
    };

    void init();
  }, []);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
};
