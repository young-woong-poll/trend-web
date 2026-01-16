/**
 * MSW 초기화 유틸리티
 * 환경에 따라 적절한 MSW 설정을 반환합니다
 */

export const isMSWEnabled = () => {
  // 서버 사이드
  if (typeof window === 'undefined') {
    return process.env.ENABLE_MSW === 'true';
  }
  // 클라이언트 사이드
  return process.env.NEXT_PUBLIC_ENABLE_MSW === 'true';
};

/**
 * MSW 초기화 (서버용)
 * instrumentation.ts에서 호출됩니다
 */
export async function initMSWServer() {
  if (!isMSWEnabled()) {
    return;
  }

  const { startMSWServer } = await import('./server');
  startMSWServer();
}

/**
 * MSW 초기화 (브라우저용)
 * MSWProvider에서 호출됩니다
 */
export async function initMSWBrowser() {
  if (!isMSWEnabled()) {
    return;
  }

  const { worker } = await import('./browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
  });

  // eslint-disable-next-line no-console
  console.log('[MSW] Browser-side mocking enabled');
}
