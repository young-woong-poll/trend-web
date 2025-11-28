import { serverFetch } from '@/lib/serverFetch';
import type { TrendVoteCountResponse } from '@/types/trend';

/**
 * 서버 컴포넌트 전용 Trend API
 */
export const serverTrendApi = {
  /**
   * Trend 투표 수 조회 (서버 컴포넌트 전용)
   */
  getTrendVoteCount: async (trendId: string): Promise<TrendVoteCountResponse> =>
    serverFetch<TrendVoteCountResponse>(`/api/v1/trend/${trendId}`, {
      next: { revalidate: 60 }, // ISR: 60초마다 재검증
    }),
};
