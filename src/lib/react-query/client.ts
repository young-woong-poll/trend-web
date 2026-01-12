import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query';

/**
 * 서버용 QueryClient 생성
 * - 각 요청마다 새로운 인스턴스 생성 (메모리 누수 방지)
 * - 즉시 GC (서버는 캐시 불필요)
 */
export function createServerQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분
        gcTime: 0, // 즉시 GC
        retry: 0, // 서버는 재시도 안함
      },
      dehydrate: {
        // 성공한 쿼리만 dehydrate (에러는 클라이언트에서 처리)
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}

/**
 * 클라이언트용 QueryClient (싱글톤)
 * - useState로 컴포넌트마다 새 인스턴스 생성 (권장 패턴)
 */
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  // 서버 환경에서는 항상 새 인스턴스
  if (typeof window === 'undefined') {
    return createServerQueryClient();
  }

  // 브라우저에서는 싱글톤 (기존 설정 유지)
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          refetchOnReconnect: true,
          retry: 1,
          retryDelay: 1000,
          gcTime: 5 * 60 * 1000, // 5분
          staleTime: 1 * 60 * 1000, // 1분
        },
        mutations: {
          retry: 0,
        },
      },
    });
  }

  return browserQueryClient;
}
