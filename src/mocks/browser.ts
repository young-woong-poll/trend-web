import { setupWorker } from 'msw/browser';

import { handlers } from '@/mocks/handlers';

/**
 * MSW Browser Worker
 * 브라우저에서 실행되는 Service Worker를 설정합니다
 */
export const worker = setupWorker(...handlers);
