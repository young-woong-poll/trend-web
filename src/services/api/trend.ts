import axiosInstance from '@/lib/axios';
import type { TrendVoteCountResponse } from '@/types/trend';

import type { AxiosResponse } from 'axios';

/**
 * Trend API 서비스
 */
export const trendApi = {
  /**
   * Trend 현재 투표 수 조회
   * GET /api/v1/trend/${trendId}
   */
  getTrendVoteCount: async (trendId: string): Promise<TrendVoteCountResponse> => {
    const response: AxiosResponse<TrendVoteCountResponse> = await axiosInstance.get(
      `/api/v1/trend/${trendId}`
    );
    return response.data;
  },
};
