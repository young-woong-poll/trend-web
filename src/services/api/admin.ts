import axiosInstance from '@/lib/axios';
import type { ElectionDetail, ElectionDetailResponse } from '@/types/election';
import type { CreateTrendRequest, TrendResponse } from '@/types/trend';

import type { AxiosResponse } from 'axios';

/**
 * Admin API 서비스
 */
export const adminApi = {
  /**
   * Admin: Trend 생성
   * POST /admin/api/v1/trend
   */
  createTrend: async (data: CreateTrendRequest): Promise<TrendResponse> => {
    const response: AxiosResponse<TrendResponse> = await axiosInstance.post(
      '/admin/api/v1/trend',
      data
    );
    return response.data;
  },

  /**
   * Admin: 선거 상세 조회
   * GET /admin/api/v1/elections/{electionId}
   */
  getElection: async (electionId: string): Promise<ElectionDetail> => {
    const response: AxiosResponse<ElectionDetailResponse> = await axiosInstance.get(
      `/admin/api/v1/elections/${electionId}`
    );
    return response.data.data;
  },
};
