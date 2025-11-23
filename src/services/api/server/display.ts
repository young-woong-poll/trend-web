import { serverFetch } from '@/lib/serverFetch';
import type { MainDisplayResponse, TrendDisplayResponse } from '@/types/trend';

/**
 * 서버 컴포넌트 전용 Display API
 */
export const serverDisplayApi = {
  /**
   * 메인 전시 조회 (서버 컴포넌트 전용)
   */
  getMainDisplay: async (): Promise<MainDisplayResponse> =>
    serverFetch<MainDisplayResponse>('/api/v1/display/main', {
      next: { revalidate: 60 }, // ISR: 60초마다 재검증
    }),

  /**
   * Trend 전시 조회 (서버 컴포넌트 전용)
   */
  getTrendDisplay: async (trendId: string): Promise<TrendDisplayResponse> =>
    serverFetch<TrendDisplayResponse>(`/api/v1/display/trend/${trendId}`, {
      next: { revalidate: 60 }, // ISR: 60초마다 재검증
    }),
};
