import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 쿼리가 성공적으로 완료된 후 다시 포커스될 때 자동으로 refetch하지 않음
      refetchOnWindowFocus: false,
      // 쿼리가 마운트될 때 자동으로 refetch하지 않음
      refetchOnMount: false,
      // 네트워크 재연결 시 자동으로 refetch
      refetchOnReconnect: true,
      // 재시도 횟수 (false = 재시도 안함, number = 재시도 횟수)
      retry: 1,
      // 에러 발생시 재시도 전 대기 시간 (밀리초)
      retryDelay: 1000,
      // 캐시 시간 (5분)
      gcTime: 5 * 60 * 1000,
      // 데이터가 stale 상태가 되는 시간 (1분)
      staleTime: 1 * 60 * 1000,
    },
    mutations: {
      // mutation 재시도 횟수
      retry: 0,
    },
  },
});
