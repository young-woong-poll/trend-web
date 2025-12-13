import axiosInstance from '@/lib/axios';
import type { TrendItemOptionsResponse } from '@/types/trend';

import type { AxiosResponse } from 'axios';

/**
 * Trend API 서비스
 */
export const trendApi = {
  /**
   * Trend 항목 옵션 카운트 조회
   * GET /api/v1/trend/{trendId}/item/{itemId}
   */
  getTrendItemOptionsCount: async (
    trendAlias: string,
    itemId: string,
    size?: number
  ): Promise<TrendItemOptionsResponse> => {
    const response: AxiosResponse<TrendItemOptionsResponse> = await axiosInstance.get(
      `/api/v1/trend/${trendAlias}/item/${itemId}`,
      { params: { size } }
    );
    return response.data;
  },
};
