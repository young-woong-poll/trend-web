import { setupServer } from 'msw/node';

import { handlers } from '@/mocks/handlers';

/**
 * MSW Node Server
 * 서버 컴포넌트에서 실행되는 MSW 서버를 설정합니다
 */
export const server = setupServer(...handlers);

/**
 * 서버 시작 헬퍼
 */
export const startMSWServer = () => {
  server.listen({
    onUnhandledRequest: 'bypass', // 처리되지 않은 요청은 실제 API로 전달
  });

  // eslint-disable-next-line no-console
  console.log('[MSW] Server-side mocking enabled');
};

/**
 * 서버 종료 헬퍼
 */
export const stopMSWServer = () => {
  server.close();
};

/**
 * 핸들러 리셋 헬퍼 (테스트용)
 */
export const resetHandlers = () => {
  server.resetHandlers();
};
