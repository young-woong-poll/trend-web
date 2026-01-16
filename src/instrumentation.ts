/**
 * Next.js Instrumentation
 * 서버 시작 시 MSW를 초기화합니다
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // 서버 런타임에서만 MSW 서버 초기화
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // ENABLE_MSW가 true인 경우에만
    if (process.env.ENABLE_MSW === 'true') {
      const { initMSWServer } = await import('./mocks');
      await initMSWServer();
    }
  }

  // Edge 런타임에서는 MSW가 지원되지 않음 (조용히 무시)
}
